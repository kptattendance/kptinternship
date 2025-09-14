import express from "express";
import {
  syncUser,
  createStaffUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { requireAuthMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/sync", requireAuthMiddleware, syncUser);
router.post("/add-staff", requireAuthMiddleware, createStaffUser);

router.get("/", requireAuthMiddleware, getAllUsers);
router.get("/:id", requireAuthMiddleware, getUserById);
router.put("/:id", requireAuthMiddleware, updateUser);
router.delete("/:id", requireAuthMiddleware, deleteUser);

export default router;
