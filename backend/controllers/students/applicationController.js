// backend/controllers/applicationController.js
import Application from "../../model/Application.js";
import cloudinary from "../../config/cloudinary.js";

/**
 * Create new application
 */
export const createApplication = async (req, res) => {
  try {
    const studentId = req.auth.userId;
    console.log("📥 Creating new application...");

    // Check for duplicate submission
    const existingApp = await Application.findOne({ studentId });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted an application.",
      });
    }

    // Handle image upload if provided
    let imageUrl = "";
    let imagePublicId = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "applications",
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    // ✅ Extract optional fields safely from req.body
    const {
      stipendAmount = 0,
      PlacedCompany = "",
      jobPackage = "",
      ...otherFields
    } = req.body;

    // Create new application entry
    const application = new Application({
      studentId,
      ...otherFields,
      stipendAmount,
      PlacedCompany,
      jobPackage,
      image: imageUrl,
      imagePublicId, // Store to delete later
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: "✅ Application submitted successfully",
      data: application,
    });
  } catch (err) {
    console.error("❌ Application create error:", err);
    res.status(400).json({
      success: false,
      message: "Failed to create application",
      error: err.message,
    });
  }
};

/**
 * Get all applications (public dashboard or admin)
 */
export const getApplications = async (req, res) => {
  try {
    const apps = await Application.find().sort({ createdAt: -1 });
    // const apps = await Application.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get application by ID
 */
export const getApplicationById = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) {
      return res
        .status(404)
        .json({ success: false, error: "Application not found" });
    }

    res.json({
      success: true,
      data: app,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update application (student or reviewer updates status/comments)
 */
export const updateApplication = async (req, res) => {
  try {
    const { stipendAmount, PlacedCompany, jobPackage, ...updateFields } =
      req.body;

    const app = await Application.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...updateFields,
          ...(stipendAmount !== undefined && { stipendAmount }),
          ...(PlacedCompany !== undefined && { PlacedCompany }),
          ...(jobPackage !== undefined && { jobPackage }),
        },
      },
      { new: true }
    );

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.json({
      success: true,
      message: "✅ Application updated successfully",
      data: app,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "❌ Failed to update application",
      error: err.message,
    });
  }
};

/**
 * Delete application (admin use-case)
 */
export const deleteApplication = async (req, res) => {
  try {
    const app = await Application.findByIdAndDelete(req.params.id);
    if (!app) {
      return res
        .status(404)
        .json({ success: false, error: "Application not found" });
    }

    // ✅ Delete image from Cloudinary if exists
    if (app.imagePublicId) {
      await cloudinary.uploader.destroy(app.imagePublicId);
    }

    res.json({ success: true, message: "🗑️ Application deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get logged-in student's application(s)
 */
export const getMyApplications = async (req, res) => {
  try {
    const studentId = req.auth.userId; // Clerk provides this
    const apps = await Application.find({ studentId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: apps.length,
      data: apps,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your applications",
      error: err.message,
    });
  }
};
