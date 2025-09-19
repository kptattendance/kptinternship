import { clerkClient } from "@clerk/express";
import User from "../model/User.js";

/**
 * Sync logged-in Clerk user into MongoDB
 */
export const syncUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const clerkUser = await clerkClient.users.getUser(userId);

    const email = clerkUser.primaryEmailAddress?.emailAddress || "";
    const name = clerkUser.fullName || "";

    // 👇 Pull role/department directly from Clerk metadata
    const roleFromClerk = clerkUser.publicMetadata?.role || "student";
    const departmentFromClerk = clerkUser.publicMetadata?.department || null;

    let userDoc = await User.findOne({ email });

    if (!userDoc) {
      // ✅ When creating new user, use Clerk's role/department if available
      userDoc = await User.create({
        clerkUserId: userId,
        email,
        name,
        role: roleFromClerk,
        department: departmentFromClerk,
      });
    } else {
      // ✅ If invited before login, sync Clerk ID
      if (!userDoc.clerkUserId) {
        userDoc.clerkUserId = userId;
        await userDoc.save();
      }

      // ✅ Ensure Mongo role matches Clerk’s role (priority is Clerk metadata)
      if (
        userDoc.role !== roleFromClerk ||
        userDoc.department !== departmentFromClerk
      ) {
        userDoc.role = roleFromClerk;
        userDoc.department = departmentFromClerk;
        await userDoc.save();
      }
    }

    // ✅ Also ensure Clerk is up-to-date if role in Mongo changes later
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role: userDoc.role,
        department: userDoc.department,
      },
    });

    return res.json({ ok: true, user: userDoc });
  } catch (err) {
    console.error("Error syncing user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * HOD adds staff → invite or update
 */
export const createStaffUser = async (req, res) => {
  try {
    const { email, role, department } = req.body;

    if (!email || !role) {
      return res
        .status(400)
        .json({ ok: false, message: "Email and role required" });
    }

    // Check if user already exists in Clerk
    let existingUsers;
    try {
      existingUsers = await clerkClient.users.getUserList({ query: email });
    } catch {
      existingUsers = { data: [] };
    }

    if (existingUsers?.data?.length > 0) {
      const existingUser = existingUsers.data[0];

      await clerkClient.users.updateUser(existingUser.id, {
        publicMetadata: { role, department },
      });

      const userDoc = await User.findOneAndUpdate(
        { email },
        { clerkUserId: existingUser.id, email, role, department },
        { upsert: true, new: true }
      );

      return res.json({
        ok: true,
        message: "User already exists, role updated.",
        user: userDoc,
      });
    }

    // Send invitation if Clerk doesn’t know this email
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
    });

    const userDoc = await User.findOneAndUpdate(
      { email },
      { email, role, department },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ ok: true, invitation, user: userDoc });
  } catch (err) {
    console.error("❌ Error creating staff user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET all users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({ ok: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * GET single user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });
    return res.json({ ok: true, user });
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * UPDATE user
 */
export const updateUser = async (req, res) => {
  try {
    const { role, department, name, phoneNumber } = req.body;

    const userDoc = await User.findByIdAndUpdate(
      req.params.id,
      { role, department, name, phoneNumber },
      { new: true }
    );

    if (!userDoc)
      return res.status(404).json({ ok: false, message: "User not found" });

    // Update Clerk metadata if Clerk ID exists
    if (userDoc.clerkUserId) {
      await clerkClient.users.updateUser(userDoc.clerkUserId, {
        publicMetadata: { role: userDoc.role, department: userDoc.department },
      });
    }

    return res.json({ ok: true, user: userDoc });
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * DELETE user
 */
export const deleteUser = async (req, res) => {
  try {
    const userDoc = await User.findByIdAndDelete(req.params.id);

    if (!userDoc)
      return res.status(404).json({ ok: false, message: "User not found" });

    // ✅ Delete Clerk account
    if (userDoc.clerkUserId) {
      try {
        await clerkClient.users.deleteUser(userDoc.clerkUserId);
      } catch (err) {
        console.warn("⚠️ Failed to delete Clerk user:", err.message);
      }
    }

    // ✅ Delete Cloudinary assets (if any public IDs stored in userDoc)
    if (userDoc.cloudinaryAssets && userDoc.cloudinaryAssets.length > 0) {
      for (const publicId of userDoc.cloudinaryAssets) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn(
            "⚠️ Failed to delete Cloudinary asset:",
            publicId,
            err.message
          );
        }
      }
    }

    return res.json({ ok: true, message: "User deleted" });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
