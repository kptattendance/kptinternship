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
