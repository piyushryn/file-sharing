const crypto = require("crypto");
const File = require("../models/FileModel");
const { generateUploadUrl, generateDownloadUrl } = require("../utils/s3Config");

/**
 * Generate a pre-signed URL for file upload
 * @route POST /api/files/getUploadUrl
 */
const getUploadUrl = async (req, res) => {
  // Validate request body
  const { fileName, fileType, fileSize } = req.body;

  if (!fileName || !fileType) {
    return res
      .status(400)
      .json({ message: "Filename and file type are required" });
  }

  if (!fileSize || isNaN(fileSize)) {
    return res.status(400).json({ message: "Valid file size is required" });
  }

  try {
    // Convert fileSize from bytes to GB for validation
    const fileSizeGB = fileSize / (1024 * 1024 * 1024);

    // Check file size against the default limit
    const defaultFileSizeLimit =
      parseInt(process.env.DEFAULT_FILE_SIZE_LIMIT) || 2; // in GB

    if (fileSizeGB > defaultFileSizeLimit) {
      return res.status(400).json({
        message: `File size exceeds the ${defaultFileSizeLimit}GB limit. Please upgrade for larger uploads.`,
        requiresUpgrade: true,
      });
    }
  } catch (error) {
    console.error("Error validating file size:", error);
    return res.status(400).json({ message: "Error validating file size" });
  }

  // Generate a unique filename for S3
  let uniqueId, s3Key;
  try {
    uniqueId = crypto.randomBytes(16).toString("hex");
    s3Key = `uploads/${uniqueId}-${fileName.replace(/\s+/g, "_")}`;
  } catch (error) {
    console.error("Error generating unique file key:", error);
    return res
      .status(500)
      .json({ message: "Error generating unique file identifier" });
  }

  // Generate pre-signed upload URL
  let uploadUrl;
  try {
    uploadUrl = await generateUploadUrl(s3Key, fileType, 3600);
  } catch (error) {
    console.error("Error generating S3 pre-signed URL:", error);
    return res.status(500).json({
      message: "Error generating upload URL from S3",
      details: error.message,
    });
  }

  // Set file expiration time (default: 4 hours)
  const defaultValidityHours =
    parseInt(process.env.DEFAULT_FILE_VALIDITY_HOURS) || 4;
  const defaultFileSizeLimit =
    parseInt(process.env.DEFAULT_FILE_SIZE_LIMIT) || 2; // in GB

  const expiresAt = new Date(
    Date.now() + defaultValidityHours * 60 * 60 * 1000
  );

  // Create file record in database
  let file;
  try {
    file = new File({
      filename: s3Key,
      originalName: fileName,
      mimeType: fileType,
      size: fileSize,
      s3Key: s3Key,
      downloadUrl: "", // Will be updated after upload completes
      expiresAt: expiresAt,
      maxSize: defaultFileSizeLimit,
      validityHours: defaultValidityHours,
    });

    await file.save();
  } catch (error) {
    console.error("Database error saving file record:", error);
    return res.status(500).json({
      message: "Error saving file information to database",
      details: error.message,
    });
  }

  // Return successful response
  res.status(200).json({
    uploadUrl,
    fileId: file._id,
    expiresAt: expiresAt,
  });
};

/**
 * Confirm file upload is complete and generate download URL
 * @route POST /api/files/confirmUpload/:fileId
 */
const confirmUpload = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { email } = req.body;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Generate pre-signed download URL
    const downloadUrl = await generateDownloadUrl(
      file.s3Key,
      file.originalName,
      file.validityHours * 60 * 60
    );

    // Update file record with download URL and email if provided
    file.downloadUrl = downloadUrl;
    if (email) {
      file.email = email;
    }

    await file.save();

    res.status(200).json({
      fileId: file._id,
      downloadUrl,
      expiresAt: file.expiresAt,
    });
  } catch (error) {
    console.error("Error confirming upload:", error);
    res.status(500).json({ message: "Error confirming upload" });
  }
};

/**
 * Get file details by ID
 * @route GET /api/files/:fileId
 */
const getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if file has expired
    if (file.expiresAt < Date.now()) {
      return res.status(410).json({ message: "This file has expired" });
    }

    // Generate a fresh download URL
    const downloadUrl = await generateDownloadUrl(
      file.s3Key,
      file.originalName,
      file.validityHours * 60 * 60
    );

    file.downloadUrl = downloadUrl;
    await file.save();

    res.status(200).json({
      fileId: file._id,
      fileName: file.originalName,
      fileSize: file.size,
      downloadUrl: file.downloadUrl,
      expiresAt: file.expiresAt,
      isPremium: file.isPremium,
      validityHours: file.validityHours,
      uploadedAt: file.uploadedAt,
    });
  } catch (error) {
    console.error("Error getting file details:", error);
    res.status(500).json({ message: "Error getting file details" });
  }
};

/**
 * Update file attributes (after payment)
 * @route PATCH /api/files/:fileId
 */
const updateFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { maxSize, validityHours, isPremium, paymentId } = req.body;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Update file attributes if provided
    if (maxSize) file.maxSize = maxSize;
    if (validityHours) {
      // Update expiry time based on new validity
      const newExpiryTime = new Date(
        file.uploadedAt.getTime() + validityHours * 60 * 60 * 1000
      );
      file.validityHours = validityHours;
      file.expiresAt = newExpiryTime;
    }
    if (isPremium !== undefined) file.isPremium = isPremium;
    if (paymentId) file.paymentId = paymentId;

    await file.save();

    // Generate a fresh download URL with new expiry time
    const downloadUrl = await generateDownloadUrl(
      file.s3Key,
      file.originalName,
      file.validityHours * 60 * 60
    );

    file.downloadUrl = downloadUrl;
    await file.save();

    res.status(200).json({
      fileId: file._id,
      fileName: file.originalName,
      fileSize: file.size,
      maxSize: file.maxSize,
      validityHours: file.validityHours,
      expiresAt: file.expiresAt,
      downloadUrl: file.downloadUrl,
      isPremium: file.isPremium,
    });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ message: "Error updating file" });
  }
};

module.exports = {
  getUploadUrl,
  confirmUpload,
  getFileById,
  updateFile,
};
