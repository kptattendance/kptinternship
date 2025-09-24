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
  requireAuthMiddleware,
  requireRole(["placement", "hod"]),
  upload.single("image"),
  createUser
);
router.put(
  "/:id",
  requireAuthMiddleware,
  requireRole(["placement", "hod"]),
  upload.single("image"),
  updateUser
);
router.delete(
  "/:id",
  requireAuthMiddleware,
  requireRole(["placement", "hod"]),
  deleteUser
);
router.get(
  "/",
  requireAuthMiddleware,
  requireRole(["placement", "hod", "company"]),
  getAllUsers
);
router.get("/:id", requireAuthMiddleware, getUserById);
// New GET endpoint for sync

export default router;
