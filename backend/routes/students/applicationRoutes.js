import express from "express";
import {
  createApplication,
  getApplications,
  getPublicApplications,
  getPublicInternshipPhotos,
  setInternshipImageApproval,
  getApplicationById,
  updateApplication,
  deleteApplication,
  bulkDeleteApplications,
  getMyApplications,
  uploadParentConsentLetter,
  getDocumentApplications,
  uploadInternshipImage,
  deleteParentConsentLetter,
  deleteInternshipImage,
  bulkDeleteInternshipImages,
  bulkDeleteParentConsentLetters,
} from "../../controllers/students/applicationController.js";
import { requireAuthMiddleware } from "../../middlewares/authMiddleware.js";
import {
  ALL_DEPARTMENT_ROLES,
  DEPARTMENT_ROLES,
  attachUserRole,
  requireRole,
} from "../../middlewares/requireRole.js";
import { generateInternshipLetter } from "../../controllers/students/pdfController.js";
import { generateUndertaking } from "../../controllers/students/undertakingController.js";
import upload from "../../middlewares/uploadMiddleware.js";
import uploadConsent from "../../middlewares/consentUpload.js";
import uploadInternshipImageFile from "../../middlewares/uploadInternshipImageFile.js";
const router = express.Router();

// Staff who can see / manage applications (own department or all)
const requireStaff = requireRole([...DEPARTMENT_ROLES, ...ALL_DEPARTMENT_ROLES]);

// Staff who can see uploaded consent letters / internship images
const requireDocumentViewer = requireRole([
  ...DEPARTMENT_ROLES,
  "placement",
  "admin",
]);

// Staff who can bulk delete uploaded documents
const requireDocumentAdmin = requireRole(["placement", "admin"]);

// Student submits new application → must be logged in
router.post(
  "/create",
  requireAuthMiddleware,
  upload.single("image"), // 👈 file upload
  createApplication
);

// Public home page dashboard → limited fields only
router.get("/public/applications", getPublicApplications);

// Public home page hero → approved internship photos only
router.get("/public/internship-photos", getPublicInternshipPhotos);

// Fetch all applications (staff only)
router.get("/getAllApplications", requireStaff, getApplications);

// Fetch single application (owner or staff)
router.get("/getApplication/:id", attachUserRole, getApplicationById);

// Update application (staff only)
router.put("/updateApplication/:id", requireStaff, updateApplication);

// Delete many applications at once (staff only)
router.delete("/applications/bulk-delete", requireStaff, bulkDeleteApplications);

// Delete application (staff only)
router.delete("/deleteApplication/:id", requireStaff, deleteApplication);

// Get logged-in student's applications
router.get("/myApplications", requireAuthMiddleware, getMyApplications);

// Download internship letter (PDF) → owner or staff
router.get("/download/:id", attachUserRole, generateInternshipLetter);

// Pre-filled undertaking (parent consent) form to print and sign → owner or staff
router.get("/undertaking/:id", attachUserRole, generateUndertaking);

router.post(
  "/myApplications/parent-consent",
  requireAuthMiddleware,
  uploadConsent.single("parentConsentLetter"),
  uploadParentConsentLetter
);

router.get("/parent-consent", requireDocumentViewer, getDocumentApplications);

router.post(
  "/myApplications/internship-image",
  requireAuthMiddleware,
  uploadInternshipImageFile.single("internshipImage"),
  uploadInternshipImage
);

router.get("/internship-images", requireDocumentViewer, getDocumentApplications);

// Placement officer approves a photo for the home page hero section
router.put(
  "/internship-images/:id/approval",
  requireDocumentAdmin,
  setInternshipImageApproval
);

router.delete(
  "/myApplications/parent-consent",
  requireAuthMiddleware,
  deleteParentConsentLetter
);

router.delete(
  "/myApplications/internship-image",
  requireAuthMiddleware,
  deleteInternshipImage
);

router.delete(
  "/parent-consent/bulk-delete",
  requireDocumentAdmin,
  bulkDeleteParentConsentLetters
);

router.delete(
  "/internship-images/bulk-delete",
  requireDocumentAdmin,
  bulkDeleteInternshipImages
);
export default router;
