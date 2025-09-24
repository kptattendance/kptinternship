import express from "express";
import {
  getCompanyDashboard,
  updateCohortOwnerMarks,
  updateCompanyMarks,
} from "../controllers/companyController.js";
import { requireAuthMiddleware } from "../middlewares/authMiddleware.js"; // Clerk auth middleware

const router = express.Router();

// Get dashboard info (company + applications)
router.get("/dashboard", requireAuthMiddleware, getCompanyDashboard);

// Update marks for application
router.put(
  "/applications/:applicationId/marks",
  requireAuthMiddleware,
  updateCompanyMarks
);

router.put(
  "/applications/:applicationId/cohortmarks",
  requireAuthMiddleware,
  updateCohortOwnerMarks
);

export default router;
