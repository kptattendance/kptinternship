import { clerkClient } from "@clerk/express";
import User from "../model/User.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

export const syncUser = async (req, res) => {
  try {
    const clerkUserId = req.userId; // from middleware
    if (!clerkUserId) {
      return res.status(400).json({ message: "No Clerk user ID found" });
    }

    // 1️⃣ Get Clerk user first
    const clerkUser = await clerkClient.users.getUser(clerkUserId);

    // Extract email + metadata from Clerk
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || null;
    const role = clerkUser?.publicMetadata?.role || "student";
    const department = clerkUser?.publicMetadata?.department || null;
    const name = clerkUser?.firstName || "";

    // 2️⃣ Check MongoDB for existing user
    let userDoc = await User.findOne({ clerkUserId });

    // 3️⃣ If not found, auto-create minimal entry in Mongo
    if (!userDoc) {
      userDoc = await User.create({
        clerkUserId,
        email,
        role,
        department,
        name,
      });
    }

    // 4️⃣ Respond with unified data
    res.json({
      ok: true,
      user: {
        clerkUserId,
        role: userDoc.role || role,
        department: userDoc.department || department,
        name: userDoc.name || name,
        email: userDoc.email || email,
        // add other fields if you want
      },
    });
  } catch (err) {
    console.error("❌ Sync user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Create user
 */
export const createUser = async (req, res) => {
  try {
    const { email, role, department, name, phoneNumber } = req.body;

    if (!email || !role) {
      return res
        .status(400)
        .json({ ok: false, message: "Email and role are required" });
    }

    // Handle uploaded file
    let photoUrl, photoPublicId;
    if (req.file) {
      photoUrl = req.file.path; // Cloudinary URL
      photoPublicId = req.file.filename; // Cloudinary public_id
    }

    // Clerk user
    let existingUsers;
    try {
      existingUsers = await clerkClient.users.getUserList({ query: email });
    } catch {
      existingUsers = { data: [] };
    }

    let clerkUser;
    if (existingUsers?.data?.length > 0) {
      clerkUser = existingUsers.data[0];
      await clerkClient.users.updateUser(clerkUser.id, {
        publicMetadata: { role, department },
      });
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
    const userDoc = await User.findById(req.params.id);

    if (!userDoc)
      return res.status(404).json({ ok: false, message: "User not found" });

    // Handle new photo
    if (req.file) {
      if (userDoc.photoPublicId) {
        try {
          await cloudinary.uploader.destroy(userDoc.photoPublicId);
        } catch (err) {
          console.warn(
            "⚠️ Failed to delete old Cloudinary image:",
            err.message
          );
        }
      }
      userDoc.photoUrl = req.file.path;
      userDoc.photoPublicId = req.file.filename;
    }

    userDoc.role = role || userDoc.role;
    userDoc.department = department || userDoc.department;
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
    const userDoc = await User.findByIdAndDelete(req.params.id);
    if (!userDoc)
      return res.status(404).json({ ok: false, message: "User not found" });

    // Delete Clerk account
    if (userDoc.clerkUserId) {
      try {
        await clerkClient.users.deleteUser(userDoc.clerkUserId);
      } catch (err) {
        console.warn("⚠️ Failed to delete Clerk user:", err.message);
      }
    }

    // Delete Cloudinary photo
    if (userDoc.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(userDoc.photoPublicId);
      } catch (err) {
        console.warn("⚠️ Failed to delete Cloudinary image:", err.message);
      }
    }

    return res.json({ ok: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * ✅ Get all users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
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

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ ok: false, message: "User not found" });

    res.json({ ok: true, user });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
