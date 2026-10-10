import mongoose from "mongoose";
import { clerkClient } from "@clerk/express";
import Application from "../model/Application.js";
import User from "../model/User.js"; // for company info
import Company from "../model/Company.js";
import { destroyImages } from "../config/cloudinary.js";
import { DEPARTMENT_ROLES } from "../middlewares/requireRole.js";

const MAX_BULK_ITEMS = 500;
const ATTENDANCE_MONTHS = ["month1", "month2", "month3", "month4", "month5"];

// Returns the mark as a number, or null when it is outside the valid range
const parseMark = (value, max) => {
  const mark = Number(value ?? 0);
  return Number.isFinite(mark) && mark >= 0 && mark <= max ? mark : null;
};

// Builds the $set for CIE-II / CIE-III marks, or an error message
const companyMarksUpdate = ({ cie2, cie3 } = {}) => {
  const set = {};

  for (const [key, label, value] of [
    ["cie2", "CIE-II", cie2],
    ["cie3", "CIE-III", cie3],
  ]) {
    if (!value) continue;

    const report = parseMark(value.report, 50);
    const useCase = parseMark(value.useCase, 30);

    if (report === null || useCase === null) {
      return { error: `Invalid ${label} marks range` };
    }

    set[`marks.${key}`] = { report, useCase, total: report + useCase };
  }

  return { set };
};

// Builds the $set for month-wise attendance, or an error message
const attendanceUpdate = (body = {}) => {
  const set = {};

  for (const month of ATTENDANCE_MONTHS) {
    if (body[month] === undefined || body[month] === null) continue;

    const days = Number(body[month]);
    if (!Number.isFinite(days) || days < 0) {
      return { error: "Invalid attendance value" };
    }

    set[`attendance.${month}`] = days;
  }

  return { set };
};

// A company may only touch applications submitted to its own email
const ownApplicationFilter = (req, applicationId) => ({
  _id: applicationId,
  companyEmail: (req.userEmail || "").toLowerCase(),
});

// Applies one update per application in a single database round trip
const bulkUpdateOwnApplications = async (req, res, buildUpdate, message) => {
  const items = req.body?.applications;

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ ok: false, message: "No applications provided" });
  }

  if (items.length > MAX_BULK_ITEMS) {
    return res
      .status(400)
      .json({ ok: false, message: "Too many applications in one request" });
  }

  const operations = [];

  for (const item of items) {
    if (!mongoose.isValidObjectId(item?._id)) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid application ID" });
    }

    const { set, error } = buildUpdate(item);
    if (error) return res.status(400).json({ ok: false, message: error });

    if (Object.keys(set).length > 0) {
      operations.push({
        updateOne: {
          filter: ownApplicationFilter(req, item._id),
          update: { $set: set },
        },
      });
    }
  }

  const result =
    operations.length > 0 ? await Application.bulkWrite(operations) : null;

  return res.json({
    ok: true,
    message,
    updatedCount: result?.matchedCount ?? 0,
  });
};

// 1️⃣ Get Company Info + Applications
export const getCompanyDashboard = async (req, res) => {
  try {
    const companyEmail = req.userEmail;

    // Find company in MongoDB
    const company = companyEmail
      ? await User.findOne({
          email: companyEmail,
          role: "company",
        })
      : null;

    if (!company)
      return res.status(404).json({ ok: false, message: "Company not found" });

    // Get all applications for this company
    const applications = await Application.find({
      companyEmail: companyEmail.toLowerCase(),
    }).sort({
      dateOfApplication: -1,
    });

    return res.json({ ok: true, company, applications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
export const updateCohortOwnerMarks = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { report, presentation } = req.body;

    // ✅ Validate input existence
    if (report === undefined && presentation === undefined) {
      return res.status(400).json({
        ok: false,
        message: "No CIE-I marks provided",
      });
    }

    // ✅ Validate ranges
    if (
      (report !== undefined && parseMark(report, 50) === null) ||
      (presentation !== undefined && parseMark(presentation, 30) === null)
    ) {
      return res.status(400).json({
        ok: false,
        message: "Invalid CIE-I marks range",
      });
    }

    // Cohort owner can only mark students of their own department
    const application =
      req.userDepartment && mongoose.isValidObjectId(applicationId)
        ? await Application.findOne({
            _id: applicationId,
            department: req.userDepartment,
          })
        : null;

    if (!application) {
      return res
        .status(404)
        .json({ ok: false, message: "Application not found" });
    }

    // ✅ ENSURE cie1 OBJECT EXISTS
    if (!application.marks) application.marks = {};
    if (!application.marks.cie1) {
      application.marks.cie1 = {
        report: 0,
        presentation: 0,
        total: 0,
      };
    }

    // ✅ UPDATE VALUES
    if (report !== undefined) application.marks.cie1.report = Number(report);

    if (presentation !== undefined)
      application.marks.cie1.presentation = Number(presentation);

    // ✅ CALCULATE TOTAL
    application.marks.cie1.total =
      application.marks.cie1.report + application.marks.cie1.presentation;

    // ✅ FORCE MONGOOSE TO TRACK CHANGE
    application.markModified("marks.cie1");

    await application.save();

    return res.json({
      ok: true,
      message: "CIE-I marks updated successfully",
      data: application.marks.cie1,
    });
  } catch (err) {
    console.error("❌ CIE-I update error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const updateCompanyCIEMarks = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const { set, error } = companyMarksUpdate(req.body);
    if (error) return res.status(400).json({ ok: false, message: error });

    const app = mongoose.isValidObjectId(applicationId)
      ? await Application.findOneAndUpdate(
          ownApplicationFilter(req, applicationId),
          { $set: set },
          { new: true }
        )
      : null;

    if (!app)
      return res
        .status(404)
        .json({ ok: false, message: "Application not found" });

    res.json({
      ok: true,
      message: "Company CIE marks updated successfully",
      data: app.marks,
    });
  } catch (err) {
    console.error("❌ Company CIE update error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Save CIE-II / CIE-III marks of all the company's students in one request
export const bulkUpdateCompanyCIEMarks = async (req, res) => {
  try {
    await bulkUpdateOwnApplications(
      req,
      res,
      companyMarksUpdate,
      "Company CIE marks updated successfully"
    );
  } catch (err) {
    console.error("❌ Company CIE bulk update error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Update attendance month-wise
export const updateAttendance = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const { set, error } = attendanceUpdate(req.body);
    if (error) return res.status(400).json({ ok: false, message: error });

    const application = mongoose.isValidObjectId(applicationId)
      ? await Application.findOneAndUpdate(
          ownApplicationFilter(req, applicationId),
          { $set: set },
          { new: true }
        )
      : null;

    if (!application) {
      return res
        .status(404)
        .json({ ok: false, message: "Application not found" });
    }

    res.json({
      ok: true,
      message: "Attendance updated successfully",
      application,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// Save attendance of all the company's students in one request
export const bulkUpdateAttendance = async (req, res) => {
  try {
    await bulkUpdateOwnApplications(
      req,
      res,
      attendanceUpdate,
      "Attendance updated successfully"
    );
  } catch (err) {
    console.error("❌ Attendance bulk update error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

/**
 * ✅ Add or link company
 */
export const addCompany = async (req, res) => {
  try {
    const { name, phoneNumber, department } = req.body;
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (
      !name ||
      !email ||
      !department ||
      typeof name !== "string" ||
      typeof department !== "string"
    ) {
      await destroyImages([req.file?.filename]);

      return res.status(400).json({
        ok: false,
        message: "Name, email and department are required",
      });
    }

    // HOD / Cohort Owner can only link companies to their own department
    if (
      DEPARTMENT_ROLES.includes(req.userRole) &&
      department.toLowerCase() !== req.userDepartment
    ) {
      await destroyImages([req.file?.filename]);

      return res.status(403).json({
        ok: false,
        message: "You can only add companies for your own department",
      });
    }

    // 1️⃣ Check MongoDB company
    let company = await Company.findOne({ email });

    // 🟡 Company already exists → link department only
    if (company) {
      await destroyImages([req.file?.filename]);

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
      await destroyImages([req.file?.filename]);

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
    });

    return res.json({
      ok: true,
      message: "Company added successfully and login created",
      company,
    });
  } catch (err) {
    console.error("❌ Add company error:", err);
    await destroyImages([req.file?.filename]);

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
    const companies = await Company.find().sort({ createdAt: -1 }).lean();
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
    }).lean();

    res.json({ ok: true, companies });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // 1️⃣ Find company
    const company = mongoose.isValidObjectId(companyId)
      ? await Company.findById(companyId)
      : null;

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
    await destroyImages([company.logoPublicId]);

    // 4️⃣ Delete the company's Clerk login (if exists).
    // The email may belong to a staff / student account, so only an
    // account whose role is "company" is ever deleted.
    try {
      const clerkUser = company.clerkUserId
        ? await clerkClient.users.getUser(company.clerkUserId)
        : (
            await clerkClient.users.getUserList({
              emailAddress: [company.email],
            })
          ).data[0];

      if (clerkUser?.publicMetadata?.role === "company") {
        await clerkClient.users.deleteUser(clerkUser.id);
      }
    } catch (err) {
      console.warn("⚠️ Clerk user delete failed:", err.message);
      // ⚠️ Do NOT stop deletion if Clerk fails
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
