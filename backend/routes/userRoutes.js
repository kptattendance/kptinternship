import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  syncUser,
} from "../controllers/userController.js";
import { requireAuthMiddleware } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/requireRole.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/sync", requireAuthMiddleware, syncUser);
router.post(
  "/create",
  requireRole(["placement", "hod", "cohortOwner"]),
  upload.single("image"),
  createUser
);
router.put(
  "/:id",
  requireRole(["placement", "hod"]),
  upload.single("image"),
  updateUser
);
router.delete("/:id", requireRole(["placement", "hod"]), deleteUser);
router.get(
  "/",
  requireRole(["placement", "hod", "company", "principal"]),
  getAllUsers
);
router.get(
  "/:id",
  requireRole(["placement", "hod", "principal", "admin"]),
  getUserById
);

export default router;
