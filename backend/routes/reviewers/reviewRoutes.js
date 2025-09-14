// backend/routes/applicationRoutes.js
import express from "express";
import {
  getPendingForReviewer,
  reviewApplication,
} from "../../controllers/reviewers/reviewController.js";
import { requireAuthMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// review-specific endpoints
router.get("/list", requireAuthMiddleware, getPendingForReviewer); // list pending for current reviewer
router.put("/:id/review", requireAuthMiddleware, reviewApplication); // approve/reject

export default router;
