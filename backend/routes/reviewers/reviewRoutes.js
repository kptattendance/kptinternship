// backend/routes/applicationRoutes.js
import express from "express";
import {
  getPendingForReviewer,
  reviewApplication,
} from "../../controllers/reviewers/reviewController.js";
import { requireAuthMiddleware } from "../../middlewares/authMiddleware.js";
import { getParentConsentApplications } from "../../controllers/students/applicationController.js";

const router = express.Router();

// review-specific endpoints
router.get("/list", requireAuthMiddleware, getPendingForReviewer); // list pending for current reviewer
router.put("/:id/review", requireAuthMiddleware, reviewApplication); // approve/reject
router.get(
  "/parent-consent",
  requireAuthMiddleware,
  getParentConsentApplications
);
export default router;
