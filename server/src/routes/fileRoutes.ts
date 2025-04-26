import express from "express";
import {
  getUploadUrl,
  confirmUpload,
  getFileById,
  updateFile,
  getFilesByUserId,
} from "../controllers/fileController";
import {
  addUserDataToRequestIfSignedIn,
  authenticateJWT,
} from "../middlewares/auth/authMiddleware";

const router = express.Router();

router.use(addUserDataToRequestIfSignedIn);

// Routes for file operations
router.post("/getUploadUrl", getUploadUrl);
router.post("/confirmUpload/:fileId", confirmUpload);
// User specific routes

router.get("/my-uploads", getFilesByUserId); // Get files by user ID

router.get("/:fileId", getFileById);
router.patch("/:fileId", updateFile);

export default router;
