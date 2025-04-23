import express from "express";
import {
  getUploadUrl,
  confirmUpload,
  getFileById,
  updateFile,
} from "../controllers/fileController";

const router = express.Router();

// Routes for file operations
router.post("/getUploadUrl", getUploadUrl);
router.post("/confirmUpload/:fileId", confirmUpload);
router.get("/:fileId", getFileById);
router.patch("/:fileId", updateFile);

export default router;
