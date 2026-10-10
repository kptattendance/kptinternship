import express from "express";
import {
  addCompany,
  bulkUpdateAttendance,
  bulkUpdateCompanyCIEMarks,
  deleteCompany,
  getAllCompanies,
  getCompaniesByDepartment,
  getCompanyDashboard,
  updateAttendance,
  updateCohortOwnerMarks,
  updateCompanyCIEMarks,
} from "../controllers/companyController.js";
import { requireAuthMiddleware } from "../middlewares/authMiddleware.js"; // Clerk auth middleware
import { attachUserRole, requireRole } from "../middlewares/requireRole.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

const requireCompany = requireRole(["company"]);

// Get dashboard info (company + applications)
router.get("/dashboard", attachUserRole, getCompanyDashboard);

// Company saves marks / attendance of all its students in one request
router.put(
  "/applications/company-marks",
  requireCompany,
  bulkUpdateCompanyCIEMarks
);

router.put("/applications/attendance", requireCompany, bulkUpdateAttendance);

router.put(
  "/applications/:applicationId/company-marks",
  requireCompany,
  updateCompanyCIEMarks
);

router.put(
  "/applications/:applicationId/cohortmarks",
  requireRole(["cohortOwner"]),
  updateCohortOwnerMarks
);

router.put(
  "/applications/:applicationId/attendance",
  requireCompany,
  updateAttendance
);

// Placement / HOD / Cohort Owner adds company
router.post(
  "/add",
  requireRole(["placement", "hod", "cohortOwner", "principal", "admin"]),
  upload.single("image"),
  addCompany
);

// View
router.get("/", requireAuthMiddleware, getAllCompanies);
router.get(
  "/department/:department",
  requireAuthMiddleware,
  getCompaniesByDepartment
);

router.delete(
  "/:companyId",
  requireRole(["placement", "principal", "admin"]),
  deleteCompany
);
export default router;
