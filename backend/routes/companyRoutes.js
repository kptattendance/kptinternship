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
import { requireRole } from "../middlewares/requireRole.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Who enters attendance and CIE-II / CIE-III: the company, or — for a college
// project — the staff member chosen as guide. Each of them only ever sees and
// updates applications that list their own email (checked in the controller),
// so students are never allowed here.
const requireEvaluator = requireRole([
  "company",
  "cohortOwner",
  "hod",
  "placement",
  "principal",
  "admin",
]);

// Get dashboard info (company / guide + their students)
router.get("/dashboard", requireEvaluator, getCompanyDashboard);

// Company saves marks / attendance of all its students in one request
router.put(
  "/applications/company-marks",
  requireEvaluator,
  bulkUpdateCompanyCIEMarks
);

router.put("/applications/attendance", requireEvaluator, bulkUpdateAttendance);

router.put(
  "/applications/:applicationId/company-marks",
  requireEvaluator,
  updateCompanyCIEMarks
);

router.put(
  "/applications/:applicationId/cohortmarks",
  requireRole(["cohortOwner"]),
  updateCohortOwnerMarks
);

router.put(
  "/applications/:applicationId/attendance",
  requireEvaluator,
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
