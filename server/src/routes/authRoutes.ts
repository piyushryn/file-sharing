import express from "express";
import {
  register,
  login,
  getCurrentUser,
  logout,
  updateProfile,
  changePassword,
} from "../controllers/authController";
import { authenticateJWT } from "../middlewares/auth/authMiddleware";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", authenticateJWT, getCurrentUser);
router.post("/logout", authenticateJWT, logout);
router.put("/profile", authenticateJWT, updateProfile);
router.put("/change-password", authenticateJWT, changePassword);

export default router;
