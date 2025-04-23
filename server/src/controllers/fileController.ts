import { Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import FileModel, { IFile } from "../models/FileModel";
import { generateUploadUrl, generateDownloadUrl } from "../utils/s3Config";

interface UploadRequestBody {
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface ConfirmUploadRequestBody {
  email?: string;
}

interface UpdateFileRequestBody {
  maxSize?: number;
  validityHours?: number;
  isPremium?: boolean;
  paymentId?: string;
}

/**
 * Generate a pre-signed URL for file upload
 * @route POST /api/files/getUploadUrl
 */
const getUploadUrl = async (
  req: Request<{}, {}, UploadRequestBody>,
  res: Response
): Promise<void> => {
  // Validate request body
  const { fileName, fileType, fileSize } = req.body;

  if (!fileName || !fileType) {
    res.status(400).json({ message: "Filename and file type are required" });
    return;
  }

  if (!fileSize || isNaN(fileSize)) {
    res.status(400).json({ message: "Valid file size is required" });
    return;
  }

  try {
    // Convert fileSize from bytes to GB for validation
    const fileSizeGB = fileSize / (1024 * 1024 * 1024);

    // Check file size against the default limit
    const defaultFileSizeLimit = parseInt(
      process.env.DEFAULT_FILE_SIZE_LIMIT || "2"
    ); // in GB

    if (fileSizeGB > defaultFileSizeLimit) {
      res.status(400).json({
        message: `File size exceeds the ${defaultFileSizeLimit}GB limit. Please upgrade for larger uploads.`,
        requiresUpgrade: true,
      });
      return;
    }
  } catch (error) {
    console.error("Error validating file size:", error);
    res.status(400).json({ message: "Error validating file size" });
    return;
  }

  // Generate a unique filename for S3
  let uniqueId: string, s3Key: string;
  try {
    uniqueId = crypto.randomBytes(16).toString("hex");
    s3Key = `uploads/${uniqueId}-${fileName.replace(/\s+/g, "_")}`;
  } catch (error) {
    console.error("Error generating unique file key:", error);
    res
      .status(500)
      .json({ message: "Error generating unique file identifier" });
    return;
  }

  // Generate pre-signed upload URL
  let uploadUrl: string;
  try {
    uploadUrl = await generateUploadUrl(s3Key, fileType, 3600);
  } catch (error: any) {
    console.error("Error generating S3 pre-signed URL:", error);
    res.status(500).json({
      message: "Error generating upload URL from S3",
      details: error.message,
    });
    return;
  }

  // Set file expiration time (default: 4 hours)
  const defaultValidityHours = parseInt(
    process.env.DEFAULT_FILE_VALIDITY_HOURS || "4"
  );
  const defaultFileSizeLimit = parseInt(
    process.env.DEFAULT_FILE_SIZE_LIMIT || "2"
  ); // in GB

  const expiresAt = new Date(
    Date.now() + defaultValidityHours * 60 * 60 * 1000
  );

  // Create file record in database
  let file: IFile;
  try {
    file = new FileModel({
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
  } catch (error: any) {
    console.error("Database error saving file record:", error);
    res.status(500).json({
      message: "Error saving file information to database",
      details: error.message,
    });
    return;
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
const confirmUpload = async (
  req: Request<{ fileId: string }, {}, ConfirmUploadRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { fileId } = req.params;
    const { email } = req.body;

    const file = await FileModel.findById(fileId);

    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
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
const getFileById = async (
  req: Request<{ fileId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { fileId } = req.params;

    const file = await FileModel.findById(fileId);

    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    // Check if file has expired
    if (file.expiresAt < new Date()) {
      res.status(410).json({ message: "This file has expired" });
      return;
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
const updateFile = async (
  req: Request<{ fileId: string }, {}, UpdateFileRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { fileId } = req.params;
    const { maxSize, validityHours, isPremium, paymentId } = req.body;

    const file = await FileModel.findById(fileId);

    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
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
    if (paymentId) {
      // Convert paymentId string to ObjectId before assigning
      file.paymentId = new mongoose.Types.ObjectId(paymentId);
    }

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

export { getUploadUrl, confirmUpload, getFileById, updateFile };
