import express, { NextFunction, Request, Response } from "express";
import { clearAllFiles } from "../controllers/adminController";
import { authenticateJWT, isAdmin } from "../middlewares/auth/authMiddleware";

const router = express.Router();

const checkAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ message: "Forbidden - Admin access required" });
    return;
  }
  next();
};

// Admin routes
router.post("/clear-files", authenticateJWT, checkAdmin, clearAllFiles);

export default router;
