// backend/controllers/applicationController.js
import mongoose from "mongoose";
import Application from "../../model/Application.js";
import cloudinary, { destroyImages } from "../../config/cloudinary.js";
import {
  applicationScope,
  canAccessApplication,
} from "../../middlewares/requireRole.js";

// The only fields a request body is allowed to set on an application.
// Review status, marks, attendance and uploaded documents are never
// accepted from the body.
const EDITABLE_FIELDS = [
  "name",
  "regNumber",
  "phoneNumber",
  "department",
  "subName",
  "internhsipType",
  "projectTitle",
  "companyName",
  "companyVillage",
  "companyCity",
  "companyTaluk",
  "companyDistrict",
  "companyState",
  "companyContact",
  "companyEmail",
  "contactPerson",
  "companyProfile",
  "startDate",
  "endDate",
  "workingHours",
  "duties",
  "tasks",
  "expectedSkills",
  "expectedTools",
  "expectedChallenges",
  "learningOutcomes",
  "jobOpportunity",
  "stipendAmount",
  "PlacedCompany",
  "jobPackage",
];

// What the public home page is allowed to see
const PUBLIC_FIELDS = [
  "regNumber",
  "name",
  "department",
  "dateOfApplication",
  "internhsipType",
  "projectTitle",
  "stipendAmount",
  "companyName",
  "companyVillage",
  "companyCity",
  "companyTaluk",
  "companyDistrict",
  "companyState",
  "PlacedCompany",
  "cohortOwner.status",
  "hod.status",
  "placement.status",
  "principal.status",
].join(" ");

const EMPTY_DOCUMENT = {
  submitted: false,
  imageUrl: "",
  publicId: "",
  uploadedAt: null,
};

// A cleared internship image also loses its home page approval
const emptyDocument = (field) =>
  field === "internshipImage"
    ? { ...EMPTY_DOCUMENT, approved: false, approvedAt: null }
    : { ...EMPTY_DOCUMENT };

// Most recently approved photos shown in the home page hero section
const MAX_HERO_PHOTOS = 30;

// A project is done at the college, so the "company" is the college itself.
// The guide's name and email stay in contactPerson / companyEmail, which is
// the login that enters attendance and CIE-II / CIE-III marks.
const COLLEGE_AS_COMPANY = {
  companyName: "Karnataka (Govt.) Polytechnic, Mangaluru",
  companyVillage: "Kadri Hills",
  companyCity: "Mangaluru",
  companyTaluk: "Mangaluru",
  companyDistrict: "Dakshina Kannada",
  companyState: "Karnataka",
};

const pickEditableFields = (body = {}, currentType) => {
  const picked = {};

  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field];
  }

  const type = picked.internhsipType || currentType;

  if (type === "Project") {
    Object.assign(picked, COLLEGE_AS_COMPANY, {
      stipendAmount: 0,
      jobOpportunity: "",
    });
  } else if (type === "Internship") {
    picked.projectTitle = "";
  }

  return picked;
};

const applicationImageIds = (application) => [
  application.imagePublicId,
  application.parentConsentLetter?.publicId,
  application.internshipImage?.publicId,
];

const validObjectIds = (ids) =>
  Array.isArray(ids)
    ? ids.filter((id) => mongoose.isValidObjectId(id))
    : [];

/**
 * Create new application
 */
export const createApplication = async (req, res) => {
  try {
    const studentId = req.userId;

    // Check for duplicate submission
    const existingApp = await Application.exists({ studentId });
    if (existingApp) {
      await destroyImages([req.file?.filename]);

      return res.status(400).json({
        success: false,
        message: "You have already submitted an application.",
      });
    }

    // multer-storage-cloudinary has already uploaded the image:
    // req.file.path = Cloudinary URL, req.file.filename = public ID
    const application = new Application({
      ...pickEditableFields(req.body),
      studentId,
      image: req.file?.path || "",
      imagePublicId: req.file?.filename || "",
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: "✅ Application submitted successfully",
      data: application,
    });
  } catch (err) {
    console.error("❌ Application create error:", err);

    // Do not leave the uploaded image behind when saving failed
    await destroyImages([req.file?.filename]);

    res.status(400).json({
      success: false,
      message: "Failed to create application",
      error: err.message,
    });
  }
};

/**
 * Public home page list — limited, non-sensitive fields only
 */
export const getPublicApplications = async (req, res) => {
  try {
    const apps = await Application.find({}, PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    res.set("Cache-Control", "public, max-age=60");
    res.json(apps);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get all applications the logged-in staff member may see
 * (HOD / Cohort Owner → own department, others → all)
 */
export const getApplications = async (req, res) => {
  try {
    const scope = applicationScope(req);

    if (!scope) {
      return res.status(400).json({
        success: false,
        message: "Department is not assigned to your account.",
      });
    }

    const apps = await Application.find(scope).sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Get application by ID (owner or authorised staff)
 */
export const getApplicationById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(404)
        .json({ success: false, error: "Application not found" });
    }

    const app = await Application.findById(req.params.id);
    if (!app || !canAccessApplication(req, app)) {
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
 * Update application details (staff only)
 */
export const updateApplication = async (req, res) => {
  try {
    const scope = applicationScope(req);

    const app =
      scope && mongoose.isValidObjectId(req.params.id)
        ? await Application.findOne({ _id: req.params.id, ...scope })
        : null;

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    app.set(pickEditableFields(req.body, app.internhsipType));
    await app.save();

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
 * Delete application (staff only)
 */
export const deleteApplication = async (req, res) => {
  try {
    const scope = applicationScope(req);

    const app =
      scope && mongoose.isValidObjectId(req.params.id)
        ? await Application.findOneAndDelete({ _id: req.params.id, ...scope })
        : null;

    if (!app) {
      return res
        .status(404)
        .json({ success: false, error: "Application not found" });
    }

    // ✅ Delete the application's images from Cloudinary
    await destroyImages(applicationImageIds(app));

    res.json({ success: true, message: "🗑️ Application deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete many applications in one request (staff only)
 */
export const bulkDeleteApplications = async (req, res) => {
  try {
    const scope = applicationScope(req);
    const requestedIds = req.body?.applicationIds;

    if (!Array.isArray(requestedIds) || requestedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one application.",
      });
    }

    const applications = scope
      ? await Application.find(
          { _id: { $in: validObjectIds(requestedIds) }, ...scope },
          "imagePublicId parentConsentLetter.publicId internshipImage.publicId"
        ).lean()
      : [];

    const deletedIds = applications.map((application) => application._id);

    if (deletedIds.length > 0) {
      await Application.deleteMany({ _id: { $in: deletedIds } });
      await destroyImages(applications.flatMap(applicationImageIds));
    }

    return res.json({
      success: true,
      message: `${deletedIds.length} application(s) deleted successfully.`,
      deletedIds,
      deletedCount: deletedIds.length,
      failedCount: requestedIds.length - deletedIds.length,
    });
  } catch (err) {
    console.error("❌ Bulk delete applications error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete applications.",
      error: err.message,
    });
  }
};

/**
 * Get logged-in student's application(s)
 */
export const getMyApplications = async (req, res) => {
  try {
    const studentId = req.userId; // Clerk provides this
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
    const studentId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload the parent consent letter.",
      });
    }

    // Find student's application
    const application = await Application.findOne({ studentId });

    if (!application) {
      await destroyImages([req.file.filename]);

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
    const oldPublicId = application.parentConsentLetter?.publicId || "";

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
      await destroyImages([oldPublicId]);
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
    await destroyImages([req.file?.filename]);

    return res.status(500).json({
      success: false,
      message: "Failed to upload parent consent letter.",
      error: err.message,
    });
  }
};

/** Upload internship image */
export const uploadInternshipImage = async (req, res) => {
  try {
    const studentId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload the internship image.",
      });
    }

    const application = await Application.findOne({ studentId });

    if (!application) {
      await destroyImages([req.file.filename]);

      return res.status(404).json({
        success: false,
        message: "Internship application not found.",
      });
    }

    // Do not allow another upload once submitted
    if (
      application.internshipImage?.submitted &&
      application.internshipImage?.imageUrl
    ) {
      // Delete the newly uploaded Cloudinary file
      await destroyImages([req.file.filename]);

      return res.status(400).json({
        success: false,
        message: "Internship image has already been submitted.",
      });
    }

    // multer-storage-cloudinary already uploaded the file
    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    // A new photo always needs a fresh approval from the placement officer
    application.internshipImage = {
      submitted: true,
      imageUrl,
      publicId,
      uploadedAt: new Date(),
      approved: false,
      approvedAt: null,
    };

    await application.save();

    return res.status(200).json({
      success: true,
      message: "Internship image uploaded successfully.",
      data: application,
    });
  } catch (err) {
    console.error("❌ Internship image upload error:", err);

    // Remove uploaded Cloudinary image if database operation failed
    await destroyImages([req.file?.filename]);

    return res.status(500).json({
      success: false,
      message: "Failed to upload internship image.",
      error: err.message,
    });
  }
};

/**
 * Applications with their uploaded documents
 * (parent consent letter + internship image) for staff.
 * HOD / Cohort Owner → own department, Placement / Admin → all
 */
export const getDocumentApplications = async (req, res) => {
  try {
    const scope = applicationScope(req);

    if (!scope) {
      return res.status(400).json({
        success: false,
        message: "Department is not assigned to your account.",
      });
    }

    const applications = await Application.find(scope, {
      studentId: 1,
      name: 1,
      regNumber: 1,
      phoneNumber: 1,
      department: 1,
      image: 1,
      parentConsentLetter: 1,
      internshipImage: 1,
    }).sort({ regNumber: 1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (err) {
    console.error("❌ Get document applications error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch document records.",
      error: err.message,
    });
  }
};

/**
 * Approve / un-approve an internship image for the public home page
 * (Placement + Admin only)
 * body: { approved: true | false }
 */
export const setInternshipImageApproval = async (req, res) => {
  try {
    const { approved } = req.body || {};

    if (typeof approved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Please specify whether the photo is approved.",
      });
    }

    // Only an uploaded photo can be approved
    const application = mongoose.isValidObjectId(req.params.id)
      ? await Application.findOneAndUpdate(
          {
            _id: req.params.id,
            "internshipImage.imageUrl": { $nin: ["", null] },
          },
          {
            $set: {
              "internshipImage.approved": approved,
              "internshipImage.approvedAt": approved ? new Date() : null,
            },
          },
          { new: true }
        )
      : null;

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Internship image not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: approved
        ? "Internship photo approved for the home page."
        : "Internship photo removed from the home page.",
      data: application.internshipImage,
    });
  } catch (err) {
    console.error("❌ Internship image approval error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update internship photo approval.",
      error: err.message,
    });
  }
};

/**
 * Public home page hero — approved internship photos only
 */
export const getPublicInternshipPhotos = async (req, res) => {
  try {
    const applications = await Application.find(
      {
        "internshipImage.approved": true,
        "internshipImage.imageUrl": { $nin: ["", null] },
      },
      "name department companyName internshipImage.imageUrl"
    )
      .sort({ "internshipImage.approvedAt": -1 })
      .limit(MAX_HERO_PHOTOS)
      .lean();

    res.set("Cache-Control", "public, max-age=60");
    res.json(
      applications.map((application) => ({
        _id: application._id,
        name: application.name,
        department: application.department,
        companyName: application.companyName,
        imageUrl: application.internshipImage.imageUrl,
      }))
    );
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Parent consent letter and internship image are stored the same way, so the
// student "delete my document" and staff "bulk delete" handlers are shared.

const deleteOwnDocument = (field, label) => async (req, res) => {
  try {
    const application = await Application.findOne({ studentId: req.userId });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Internship application not found.",
      });
    }

    const publicId = application[field]?.publicId;

    if (!publicId) {
      return res.status(404).json({
        success: false,
        message: `${label} not found.`,
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Clear MongoDB fields
    application[field] = emptyDocument(field);

    await application.save();

    return res.status(200).json({
      success: true,
      message: `${label} deleted successfully.`,
    });
  } catch (err) {
    console.error(`❌ Delete ${label.toLowerCase()} error:`, err);

    return res.status(500).json({
      success: false,
      message: `Failed to delete ${label.toLowerCase()}.`,
      error: err.message,
    });
  }
};

const bulkDeleteDocuments = (field, label) => async (req, res) => {
  try {
    const { applicationIds } = req.body || {};

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one application.",
      });
    }

    const applications = await Application.find(
      {
        _id: { $in: validObjectIds(applicationIds) },
        [`${field}.publicId`]: { $nin: ["", null] },
      },
      `${field}.publicId`
    ).lean();

    // Delete the images in parallel, then clear all records in one query
    const removed = new Set(
      await destroyImages(
        applications.map((application) => application[field].publicId)
      )
    );

    const clearedIds = applications
      .filter((application) => removed.has(application[field].publicId))
      .map((application) => application._id);

    if (clearedIds.length > 0) {
      await Application.updateMany(
        { _id: { $in: clearedIds } },
        { $set: { [field]: emptyDocument(field) } }
      );
    }

    return res.status(200).json({
      success: true,
      message: `${clearedIds.length} ${label}(s) deleted successfully.`,
      deletedCount: clearedIds.length,
      failedCount: applications.length - clearedIds.length,
    });
  } catch (err) {
    console.error(`❌ Bulk delete ${label}s error:`, err);

    return res.status(500).json({
      success: false,
      message: `Failed to delete ${label}s.`,
      error: err.message,
    });
  }
};

/** Delete parent consent letter */
export const deleteParentConsentLetter = deleteOwnDocument(
  "parentConsentLetter",
  "Parent consent letter"
);

/** Delete internship image */
export const deleteInternshipImage = deleteOwnDocument(
  "internshipImage",
  "Internship image"
);

// Placement + Admin only
export const bulkDeleteParentConsentLetters = bulkDeleteDocuments(
  "parentConsentLetter",
  "parent consent letter"
);

// Placement + Admin only
export const bulkDeleteInternshipImages = bulkDeleteDocuments(
  "internshipImage",
  "internship image"
);
