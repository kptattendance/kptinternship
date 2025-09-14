// backend/controllers/applicationController.js
import Application from "../../model/Application.js";

/**
 * Create new application
 */
export const createApplication = async (req, res) => {
  try {
    const studentId = req.auth.userId;
    console.log("near reate function");
    const existingApp = await Application.findOne({ studentId });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted an application.",
      });
    }

    let imageUrl = "";
    if (req.file && req.file.path) {
      imageUrl = req.file.path; // ✅ Cloudinary gives hosted URL
    }
    console.log(imageUrl);
    const application = new Application({
      studentId,
      ...req.body,
      image: imageUrl,
    });

    await application.save();
    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (err) {
    console.error("Application create error:", err);
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
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get application by ID
 */
export const getApplicationById = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Not found" });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update application (student or reviewer updates status/comments)
 */
export const updateApplication = async (req, res) => {
  try {
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!app) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
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
    if (!app) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Application deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get logged-in student's application(s)
 */
export const getMyApplications = async (req, res) => {
  try {
    const studentId = req.auth.userId; // Clerk adds this
    const apps = await Application.find({ studentId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
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
