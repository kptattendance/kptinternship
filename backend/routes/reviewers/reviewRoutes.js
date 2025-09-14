// backend/routes/applicationRoutes.js
import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getPendingForReviewer,
  reviewApplication,
} from "../../controllers/reviewers/reviewController.js";

const router = express.Router();

// review-specific endpoints
router.get("/list", requireAuth(), getPendingForReviewer); // list pending for current reviewer
router.put("/:id/review", requireAuth(), reviewApplication); // approve/reject

export default router;
