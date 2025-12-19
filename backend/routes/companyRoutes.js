import express from "express";
import {
  addCompany,
  deleteCompany,
  getAllCompanies,
  getCompaniesByDepartment,
  getCompanyDashboard,
  updateAttendance,
  updateCohortOwnerMarks,
  updateCompanyMarks,
} from "../controllers/companyController.js";
import { requireAuthMiddleware } from "../middlewares/authMiddleware.js"; // Clerk auth middleware
import upload from "../middlewares/uploadMiddleware.js";

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

router.put(
  "/applications/:applicationId/attendance",
  requireAuthMiddleware,
  updateAttendance
);

// Placement / HOD adds company
router.post("/add", requireAuthMiddleware, upload.single("image"), addCompany);

// View
router.get("/", requireAuthMiddleware, getAllCompanies);
router.get(
  "/department/:department",
  requireAuthMiddleware,
  getCompaniesByDepartment
);

router.delete("/:companyId", requireAuthMiddleware, deleteCompany);
export default router;
