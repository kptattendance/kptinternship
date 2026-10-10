// backend/routes/applicationRoutes.js
import express from "express";
import {
  getPendingForReviewer,
  reviewApplication,
} from "../../controllers/reviewers/reviewController.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { getDocumentApplications } from "../../controllers/students/applicationController.js";

const router = express.Router();

const requireReviewer = requireRole([
  "cohortOwner",
  "hod",
  "placement",
  "principal",
]);

// review-specific endpoints
router.get("/list", requireReviewer, getPendingForReviewer); // list pending for current reviewer
router.put("/:id/review", requireReviewer, reviewApplication); // approve/reject
router.get(
  "/parent-consent",
  requireRole(["cohortOwner", "hod", "placement", "admin"]),
  getDocumentApplications
);
export default router;
