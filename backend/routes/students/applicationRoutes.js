import express from "express";
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getMyApplications,
  uploadParentConsentLetter,
  getParentConsentApplications,
} from "../../controllers/students/applicationController.js";
import { requireAuthMiddleware } from "../../middlewares/authMiddleware.js";
import { generateInternshipLetter } from "../../controllers/students/pdfController.js";
import upload from "../../middlewares/uploadMiddleware.js";
import uploadConsent from "../../middlewares/consentUpload.js";

const router = express.Router();

// Student submits new application → must be logged in
router.post(
  "/create",
  requireAuthMiddleware,
  upload.single("image"), // 👈 file upload
  createApplication
);

// Fetch all applications (public / dashboard)
router.get("/getAllApplications", getApplications);

// Fetch single application
router.get("/getApplication/:id", requireAuthMiddleware, getApplicationById);

// Update application
router.put("/updateApplication/:id", requireAuthMiddleware, updateApplication);

// Delete application
router.delete(
  "/deleteApplication/:id",
  requireAuthMiddleware,
  deleteApplication
);

// Get logged-in student's applications
router.get("/myApplications", requireAuthMiddleware, getMyApplications);

// Download internship letter (PDF)
router.get("/download/:id", generateInternshipLetter);

router.post(
  "/parent-consent",
  requireAuthMiddleware,
  uploadConsent.single("consentLetter"),
  uploadParentConsentLetter
);

router.get(
  "/parent-consent",
  requireAuthMiddleware,
  getParentConsentApplications
);

export default router;
