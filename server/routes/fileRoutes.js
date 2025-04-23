const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");

// Routes for file operations
router.post("/getUploadUrl", fileController.getUploadUrl);
router.post("/confirmUpload/:fileId", fileController.confirmUpload);
router.get("/:fileId", fileController.getFileById);
router.patch("/:fileId", fileController.updateFile);

module.exports = router;
