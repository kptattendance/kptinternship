import Application from "../model/Application.js";
import User from "../model/User.js"; // for company info

// 1️⃣ Get Company Info + Applications
import { clerkClient } from "@clerk/express";
export const getCompanyDashboard = async (req, res) => {
  try {
    // Clerk userId from middleware
    const clerkUserId = req.userId;

    // Fetch Clerk user to get email
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const companyEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

    // Find company in MongoDB
    const company = await User.findOne({
      email: companyEmail,
      role: "company",
    });

    if (!company)
      return res.status(404).json({ ok: false, message: "Company not found" });

    // Get all applications for this company
    const applications = await Application.find({ companyEmail }).sort({
      dateOfApplication: -1,
    });

    return res.json({ ok: true, company, applications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// 2️⃣ Update Marks for Company (2nd and 3rd internal)
export const updateCompanyMarks = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { internal2, internal3 } = req.body;

    const application = await Application.findById(applicationId);
    if (!application)
      return res
        .status(404)
        .json({ ok: false, message: "Application not found" });

    application.marks.internal2 = internal2 ?? application.marks.internal2;
    application.marks.internal3 = internal3 ?? application.marks.internal3;

    await application.save();

    res.json({ ok: true, message: "Marks updated successfully", application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const updateCohortOwnerMarks = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { internal1 } = req.body;

    const application = await Application.findById(applicationId);
    if (!application)
      return res
        .status(404)
        .json({ ok: false, message: "Application not found" });

    application.marks.internal1 = internal1 ?? application.marks.internal1;

    await application.save();

    res.json({ ok: true, message: "Marks updated successfully", application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Update attendance month-wise
export const updateAttendance = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { month1, month2, month3, month4, month5 } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res
        .status(404)
        .json({ ok: false, message: "Application not found" });
    }

    application.attendance.month1 = month1 ?? application.attendance.month1;
    application.attendance.month2 = month2 ?? application.attendance.month2;
    application.attendance.month3 = month3 ?? application.attendance.month3;
    application.attendance.month4 = month4 ?? application.attendance.month4;
    application.attendance.month5 = month5 ?? application.attendance.month5;

    await application.save();

    res.json({
      ok: true,
      message: "Attendance updated successfully",
      application,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

import Company from "../model/Company.js";
import cloudinary from "../config/cloudinary.js";

/**
 * ✅ Add or link company
 */
export const addCompany = async (req, res) => {
  try {
    const { name, email, phoneNumber, department } = req.body;

    if (!name || !email || !department) {
      return res.status(400).json({
        ok: false,
        message: "Name, email and department are required",
      });
    }

    // 1️⃣ Check MongoDB company
    let company = await Company.findOne({ email });

    // 🟡 Company already exists → link department only
    if (company) {
      if (!company.departments.includes(department)) {
        company.departments.push(department);
        await company.save();
      }

      return res.json({
        ok: true,
        alreadyExists: true,
        message: "Company already exists. Department linked successfully.",
        company,
      });
    }

    // 2️⃣ Create Clerk user (company login)
    let clerkUser;
    try {
      const existing = await clerkClient.users.getUserList({
        emailAddress: [email],
      });

      if (existing.data.length > 0) {
        clerkUser = existing.data[0];
      } else {
        clerkUser = await clerkClient.users.createUser({
          emailAddress: [email],
          publicMetadata: {
            role: "company",
          },
        });
      }
    } catch (err) {
      console.error("❌ Clerk user creation failed:", err);
      return res.status(500).json({
        ok: false,
        message: "Failed to create company login",
      });
    }

    // 3️⃣ Upload logo (if any)
    let logoUrl, logoPublicId;
    if (req.file) {
      logoUrl = req.file.path;
      logoPublicId = req.file.filename;
    }

    // 4️⃣ Create MongoDB Company
    company = await Company.create({
      name,
      email,
      phoneNumber,
      departments: [department],
      logoUrl,
      logoPublicId,
      clerkUserId: clerkUser.id,
      createdBy: req.user?._id,
    });

    return res.json({
      ok: true,
      message: "Company added successfully and login created",
      company,
    });
  } catch (err) {
    console.error("❌ Add company error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
};

/**
 * ✅ Get all companies
 */
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json({ ok: true, companies });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

/**
 * ✅ Get companies by department
 */
export const getCompaniesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    const companies = await Company.find({
      departments: department,
    });

    res.json({ ok: true, companies });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // 1️⃣ Find company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found",
      });
    }

    // 2️⃣ Prevent delete if applications exist
    const hasApplications = await Application.exists({
      companyEmail: company.email,
    });

    if (hasApplications) {
      return res.status(400).json({
        ok: false,
        message: "Company has applications linked. Cannot delete.",
      });
    }

    // 3️⃣ Delete Cloudinary logo (if exists)
    if (company.logoPublicId) {
      try {
        await cloudinary.uploader.destroy(company.logoPublicId);
      } catch (err) {
        console.warn("⚠️ Cloudinary delete failed:", err.message);
      }
    }

    // 4️⃣ Delete Clerk user (if exists)
    if (company.clerkUserId) {
      try {
        await clerkClient.users.deleteUser(company.clerkUserId);
      } catch (err) {
        console.warn("⚠️ Clerk user delete failed:", err.message);
        // ⚠️ Do NOT stop deletion if Clerk fails
      }
    } else {
      // fallback: delete by email if clerkUserId not stored
      try {
        const users = await clerkClient.users.getUserList({
          emailAddress: [company.email],
        });

        if (users.data.length > 0) {
          await clerkClient.users.deleteUser(users.data[0].id);
        }
      } catch (err) {
        console.warn("⚠️ Clerk email-based delete failed:", err.message);
      }
    }

    // 5️⃣ Delete MongoDB company record
    await Company.findByIdAndDelete(companyId);

    res.json({
      ok: true,
      message: "Company and associated login deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete company error:", err);
    res.status(500).json({
      ok: false,
      message: err.message,
    });
  }
};
