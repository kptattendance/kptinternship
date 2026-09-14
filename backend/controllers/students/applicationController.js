// backend/controllers/applicationController.js
import Application from "../../model/Application.js";
import cloudinary from "../../config/cloudinary.js";

/**
 * Create new application
 */
export const createApplication = async (req, res) => {
  try {
    const studentId = req.auth.userId;

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
      attendance = {},
      ...otherFields
    } = req.body;

    // Create new application entry
    const application = new Application({
      studentId,
      ...otherFields,
      stipendAmount,
      PlacedCompany,
      jobPackage,
      attendance: {
        month1: attendance.month1 ?? 0,
        month2: attendance.month2 ?? 0,
        month3: attendance.month3 ?? 0,
        month4: attendance.month4 ?? 0,
      },
      image: imageUrl,
      imagePublicId,
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
    const {
      stipendAmount,
      PlacedCompany,
      jobPackage,
      attendance,
      ...updateFields
    } = req.body;

    const app = await Application.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...updateFields,
          ...(stipendAmount !== undefined && { stipendAmount }),
          ...(PlacedCompany !== undefined && { PlacedCompany }),
          ...(jobPackage !== undefined && { jobPackage }),
          ...(attendance && {
            "attendance.month1": attendance.month1,
            "attendance.month2": attendance.month2,
            "attendance.month3": attendance.month3,
            "attendance.month4": attendance.month4,
          }),
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



/**
 * Upload / replace parent consent letter
 */
export const uploadParentConsentLetter = async (req, res) => {
  try {
    const studentId = req.auth.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload the parent consent letter.",
      });
    }

    // Find student's application
    const application = await Application.findOne({ studentId });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Internship application not found.",
      });
    }

    /*
     * Keep the old Cloudinary public ID.
     * If the student is replacing an existing letter,
     * we will delete the old image after saving the new one.
     */
    const oldPublicId =
      application.parentConsentLetter?.publicId || "";

    /*
     * multer-storage-cloudinary has already uploaded
     * the image to Cloudinary.
     *
     * req.file.path   = secure Cloudinary URL
     * req.file.filename = Cloudinary public ID
     */
    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    application.parentConsentLetter = {
      submitted: true,
      imageUrl,
      publicId,
      uploadedAt: new Date(),
    };

    await application.save();

    /*
     * Delete the previous consent image from Cloudinary
     * after the new image has been successfully saved.
     */
    if (oldPublicId && oldPublicId !== publicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete old consent letter:",
          cloudinaryError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Parent consent letter uploaded successfully.",
      data: application,
    });
  } catch (err) {
    console.error("❌ Parent consent upload error:", err);

    /*
     * If something failed after Cloudinary uploaded the new file,
     * try to remove the newly uploaded file.
     */
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up Cloudinary image:",
          cleanupError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload parent consent letter.",
      error: err.message,
    });
  }
};


/**
 * Get applications with parent consent status
 *
 * Used by:
 * - Cohort Owner
 * - HOD
 * - Admin
 */
export const getParentConsentApplications = async (req, res) => {
  try {
    const applications = await Application.find(
      {},
      {
        studentId: 1,
        name: 1,
        regNumber: 1,
        department: 1,
        image: 1,
        parentConsentLetter: 1,
        cohortOwner: 1,
        hod: 1,
      }
    ).sort({ regNumber: 1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (err) {
    console.error(
      "❌ Get parent consent applications error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch parent consent records.",
      error: err.message,
    });
  }
};