import { clerkClient } from "@clerk/express";
import User from "../model/User.js";
import { destroyImages } from "../config/cloudinary.js";
import mongoose from "mongoose";
import {
  clearClerkProfile,
  getClerkProfile,
} from "../middlewares/authMiddleware.js";

// Which roles each role is allowed to assign to (or manage in) other users.
// Without this, anyone allowed to create users could make themselves
// placement officer / principal.
const GRANTABLE_ROLES = {
  admin: [
    "student",
    "cohortOwner",
    "hod",
    "placement",
    "principal",
    "admin",
    "company",
  ],
  placement: [
    "student",
    "cohortOwner",
    "hod",
    "placement",
    "principal",
    "company",
  ],
  hod: ["cohortOwner"],
  cohortOwner: ["company"],
};

// Roles that only act inside their own department
const isDepartmentBound = (req) => req.userRole === "hod";

const canGrantRole = (req, role, department) => {
  if (!GRANTABLE_ROLES[req.userRole]?.includes(role)) return false;

  // HOD can only add / keep staff in their own department
  if (isDepartmentBound(req)) {
    return !!req.userDepartment && department === req.userDepartment;
  }

  return true;
};

// Can the logged-in user modify / delete an account that currently has
// this role and department?
const canManageAccount = (req, role, department) =>
  canGrantRole(req, role || "student", department);

const forbidden = (res, message) =>
  res.status(403).json({ ok: false, message });

export const syncUser = async (req, res) => {
  try {
    const clerkUserId = req.userId;
    if (!clerkUserId) {
      return res.status(400).json({ message: "No Clerk user ID found" });
    }

    // 1️⃣ Fetch user from Clerk
    const { email, role, department, name } =
      await getClerkProfile(clerkUserId);

    // 2️⃣ Find user in Mongo
    let userDoc = await User.findOne({ clerkUserId });

    // 3️⃣ If not found, try to link via existing email
    if (!userDoc && email) {
      userDoc = await User.findOne({ email });
      if (userDoc) {
        userDoc.clerkUserId = clerkUserId;
        await userDoc.save();
      }
    }

    // 4️⃣ If still not found, create new
    if (!userDoc) {
      userDoc = await User.create({
        clerkUserId,
        email,
        role,
        department,
        name,
      });
    }

    // 5️⃣ Respond
    res.json({
      ok: true,
      user: {
        clerkUserId,
        role: userDoc.role || role,
        department: userDoc.department || department,
        name: userDoc.name || name,
        email: userDoc.email || email,
      },
    });
  } catch (err) {
    console.error("❌ Sync user failed:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * ✅ Create user
 */
export const createUser = async (req, res) => {
  try {
    const { role, name, phoneNumber } = req.body;
    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : "";
    const department =
      typeof req.body.department === "string" && req.body.department
        ? req.body.department
        : undefined;

    if (!email || !role || typeof role !== "string") {
      await destroyImages([req.file?.filename]);

      return res
        .status(400)
        .json({ ok: false, message: "Email and role are required" });
    }

    if (!canGrantRole(req, role, department)) {
      await destroyImages([req.file?.filename]);

      return forbidden(res, "You are not allowed to assign this role");
    }

    // Never let someone overwrite an existing account above their level
    const existingDoc = await User.findOne({ email }).lean();
    if (
      existingDoc &&
      existingDoc.role !== "student" &&
      !canGrantRole(req, existingDoc.role, existingDoc.department)
    ) {
      await destroyImages([req.file?.filename]);

      return forbidden(
        res,
        "This email already belongs to an account you cannot modify"
      );
    }

    // Handle uploaded file
    let photoUrl, photoPublicId;
    if (req.file) {
      photoUrl = req.file.path; // Cloudinary URL
      photoPublicId = req.file.filename; // Cloudinary public_id
    }

    // Clerk user (exact email match)
    let existingUsers;
    try {
      existingUsers = await clerkClient.users.getUserList({
        emailAddress: [email],
      });
    } catch {
      existingUsers = { data: [] };
    }

    let clerkUser;
    if (existingUsers?.data?.length > 0) {
      clerkUser = existingUsers.data[0];

      // Same check against the Clerk account.
      // (An account that has only signed in so far is a plain student.)
      const existingRole = clerkUser.publicMetadata?.role || "student";
      const existingDepartment = clerkUser.publicMetadata?.department
        ? String(clerkUser.publicMetadata.department).toLowerCase()
        : undefined;

      if (
        existingRole !== "student" &&
        !canGrantRole(req, existingRole, existingDepartment)
      ) {
        await destroyImages([req.file?.filename]);

        return forbidden(
          res,
          "This email already belongs to an account you cannot modify"
        );
      }

      await clerkClient.users.updateUser(clerkUser.id, {
        publicMetadata: { role, department },
      });
      clearClerkProfile(clerkUser.id);
    } else {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        publicMetadata: { role, department },
      });
    }

    // Upsert MongoDB
    const userDoc = await User.findOneAndUpdate(
      { email },
      {
        clerkUserId: clerkUser.id,
        email,
        role,
        department,
        name,
        phoneNumber,
        photoUrl: photoUrl || undefined,
        photoPublicId: photoPublicId || undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      ok: true,
      message: "User created successfully",
      user: userDoc,
    });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * ✅ Update user
 */
export const updateUser = async (req, res) => {
  try {
    const { role, department, name, phoneNumber } = req.body;
    const userDoc = mongoose.isValidObjectId(req.params.id)
      ? await User.findById(req.params.id)
      : null;

    if (!userDoc) {
      await destroyImages([req.file?.filename]);

      return res.status(404).json({ ok: false, message: "User not found" });
    }

    const isSelf = userDoc.clerkUserId === req.userId;
    const newRole = role || userDoc.role;
    const newDepartment = department || userDoc.department;
    const changesAccess =
      newRole !== userDoc.role || newDepartment !== userDoc.department;

    // You may edit your own name / phone / photo, but changing anyone's
    // role or department needs permission over both the old and new role
    if (
      (!isSelf && !canManageAccount(req, userDoc.role, userDoc.department)) ||
      (changesAccess && !canGrantRole(req, newRole, newDepartment))
    ) {
      await destroyImages([req.file?.filename]);

      return forbidden(res, "You are not allowed to modify this user");
    }

    // Handle new photo
    if (req.file) {
      await destroyImages([userDoc.photoPublicId]);

      userDoc.photoUrl = req.file.path;
      userDoc.photoPublicId = req.file.filename;
    }

    userDoc.role = newRole;
    userDoc.department = newDepartment;
    userDoc.name = name || userDoc.name;
    userDoc.phoneNumber = phoneNumber || userDoc.phoneNumber;

    await userDoc.save();

    if (userDoc.clerkUserId) {
      await clerkClient.users.updateUser(userDoc.clerkUserId, {
        publicMetadata: {
          role: userDoc.role,
          department: userDoc.department,
        },
      });
      clearClerkProfile(userDoc.clerkUserId);
    }

    return res.json({ ok: true, message: "User updated", user: userDoc });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * ✅ Delete user
 */
export const deleteUser = async (req, res) => {
  try {
    const userDoc = mongoose.isValidObjectId(req.params.id)
      ? await User.findById(req.params.id)
      : null;

    if (!userDoc)
      return res.status(404).json({ ok: false, message: "User not found" });

    if (!canManageAccount(req, userDoc.role, userDoc.department)) {
      return forbidden(res, "You are not allowed to delete this user");
    }

    await userDoc.deleteOne();

    // Delete Clerk account
    if (userDoc.clerkUserId) {
      try {
        await clerkClient.users.deleteUser(userDoc.clerkUserId);
      } catch (err) {
        console.warn("⚠️ Failed to delete Clerk user:", err.message);
      }
      clearClerkProfile(userDoc.clerkUserId);
    }

    // Delete Cloudinary photo
    await destroyImages([userDoc.photoPublicId]);

    return res.json({ ok: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * ✅ Get all users the logged-in user may see
 */
export const getAllUsers = async (req, res) => {
  try {
    let filter = {};
    let fields = null;

    if (req.userRole === "company") {
      // Companies only need the college contacts shown on their dashboard
      filter = { role: { $in: ["principal", "hod", "cohortOwner"] } };
      fields = "name email phoneNumber role department photoUrl";
    } else if (isDepartmentBound(req)) {
      filter = { department: req.userDepartment };
    }

    const users = await User.find(filter, fields)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, users });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * ✅ Get single user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Invalid user ID" });
    }

    const user = await User.findById(id).lean();
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    res.json({ ok: true, user });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
