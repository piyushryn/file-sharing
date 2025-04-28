import { Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import FileModel, { IFile } from "../models/FileModel";
import { generateUploadUrl, generateDownloadUrl } from "../utils/s3Config";
import { sendFileSharedEmail } from "../utils/emailService";
import { getShareUrl } from "../utils/getShareUrl";

// Helper function to generate request ID for tracking
const generateRequestId = () => crypto.randomBytes(8).toString("hex");

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
const downloadFile = async (
  req: Request<
    {
      fileId: string;
    },
    {},
    {}
  >,
  res: Response
): Promise<void> => {
  const file = await FileModel.findById(req.params.fileId);
  if (!file) {
    res.status(404).json({ message: "File not found" });
    return;
  }
  if (file.expiresAt < new Date()) {
    res.status(410).json({ message: "This file has expired" });
    return;
  }
  if (!file.downloadUrl) {
    res.status(400).json({ message: "File is not ready for download" });
    return;
  }

  res.redirect(file.downloadUrl);
  return;
};

/**
 * Generate a pre-signed URL for file upload
 * @route POST /api/files/getUploadUrl
 */
const getUploadUrl = async (
  req: Request<{}, {}, UploadRequestBody>,
  res: Response
): Promise<void> => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] [getUploadUrl] Request received:`, {
    body: req.body,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Validate request body
  const { fileName, fileType, fileSize } = req.body;

  if (!fileName || !fileType) {
    console.log(
      `[${requestId}] [getUploadUrl] Validation failed: Missing filename or filetype`
    );
    res.status(400).json({ message: "Filename and file type are required" });
    return;
  }

  if (!fileSize || isNaN(fileSize)) {
    console.log(
      `[${requestId}] [getUploadUrl] Validation failed: Invalid file size`
    );
    res.status(400).json({ message: "Valid file size is required" });
    return;
  }

  try {
    // Convert fileSize from bytes to GB for validation
    const fileSizeGB = fileSize / (1024 * 1024 * 1024);
    console.log(`[${requestId}] [getUploadUrl] File size in GB:`, fileSizeGB);

    // Check file size against the default limit
    const defaultFileSizeLimit = parseInt(
      process.env.DEFAULT_FILE_SIZE_LIMIT || "2"
    ); // in GB

    if (fileSizeGB > defaultFileSizeLimit) {
      console.log(
        `[${requestId}] [getUploadUrl] File exceeds size limit of ${defaultFileSizeLimit}GB`
      );
      res.status(400).json({
        message: `File size exceeds the ${defaultFileSizeLimit}GB limit. Please upgrade for larger uploads.`,
        requiresUpgrade: true,
      });
      return;
    }
  } catch (error) {
    console.error(
      `[${requestId}] [getUploadUrl] Error validating file size:`,
      error
    );
    res.status(400).json({ message: "Error validating file size" });
    return;
  }

  // Generate a unique filename for S3
  let uniqueId: string, s3Key: string;
  try {
    uniqueId = crypto.randomBytes(16).toString("hex");
    s3Key = `uploads/${uniqueId}-${fileName.replace(/\s+/g, "_")}`;
    console.log(`[${requestId}] [getUploadUrl] Generated S3 key:`, s3Key);
  } catch (error) {
    console.error(
      `[${requestId}] [getUploadUrl] Error generating unique file key:`,
      error
    );
    res
      .status(500)
      .json({ message: "Error generating unique file identifier" });
    return;
  }

  // Generate pre-signed upload URL
  let uploadUrl: string;
  try {
    uploadUrl = await generateUploadUrl(s3Key, fileType, 3600);
    console.log(
      `[${requestId}] [getUploadUrl] Generated upload URL for S3 (partial):`,
      uploadUrl.substring(0, 60) + "..."
    );
  } catch (error: any) {
    console.error(
      `[${requestId}] [getUploadUrl] Error generating S3 pre-signed URL:`,
      error
    );
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
  console.log(`[${requestId}] [getUploadUrl] File will expire at:`, expiresAt);

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
    console.log(
      `[${requestId}] [getUploadUrl] File record created in DB with ID:`,
      file._id
    );
  } catch (error: any) {
    console.error(
      `[${requestId}] [getUploadUrl] Database error saving file record:`,
      error
    );
    res.status(500).json({
      message: "Error saving file information to database",
      details: error.message,
    });
    return;
  }

  // Return successful response
  const response = {
    uploadUrl,
    fileId: file._id,
    expiresAt: expiresAt,
  };
  console.log(`[${requestId}] [getUploadUrl] Success response:`, {
    fileId: file._id,
    expiresAt,
  });
  res.status(200).json(response);
};

/**
 * Confirm file upload is complete and generate download URL
 * @route POST /api/files/confirmUpload/:fileId
 */
const confirmUpload = async (
  req: Request<{ fileId: string }, {}, ConfirmUploadRequestBody>,
  res: Response
): Promise<void> => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] [confirmUpload] Request received:`, {
    params: req.params,
    body: req.body,
    ip: req.ip,
  });

  try {
    const { fileId } = req.params;
    const { email } = req.body;

    console.log(
      `[${requestId}] [confirmUpload] Looking up file with ID:`,
      fileId
    );
    const file = await FileModel.findById(fileId);

    if (!file) {
      console.log(
        `[${requestId}] [confirmUpload] File not found with ID:`,
        fileId
      );
      res.status(404).json({ message: "File not found" });
      return;
    }

    // Generate pre-signed download URL
    console.log(
      `[${requestId}] [confirmUpload] Generating download URL for file:`,
      file.s3Key
    );
    const downloadUrl = await generateDownloadUrl(
      file.s3Key,
      file.originalName,
      file.validityHours * 60 * 60
    );

    // Update file record with download URL and email if provided
    file.downloadUrl = downloadUrl;
    file.userId = req.user && req.user.id; // Associate file with user if authenticated
    if (email) {
      file.email = email;
      console.log(
        `[${requestId}] [confirmUpload] Associating email with file:`,
        email
      );
    }

    await file.save();
    if (file.email)
      sendFileSharedEmail(
        file.email,
        file.originalName,
        getShareUrl(file.id),
        file.expiresAt,
        req.user?.name
      );
    console.log(
      `[${requestId}] [confirmUpload] File record updated with download URL`
    );

    const response = {
      fileId: file._id,
      downloadUrl,
      expiresAt: file.expiresAt,
    };
    console.log(`[${requestId}] [confirmUpload] Success response:`, {
      fileId: file._id,
      expiresAt: file.expiresAt,
    });
    res.status(200).json(response);
  } catch (error) {
    console.error(
      `[${requestId}] [confirmUpload] Error confirming upload:`,
      error
    );
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
  const requestId = generateRequestId();
  console.log(`[${requestId}] [getFileById] Request received:`, {
    params: req.params,
    ip: req.ip,
  });

  try {
    const { fileId } = req.params;

    console.log(
      `[${requestId}] [getFileById] Looking up file with ID:`,
      fileId
    );
    const file = await FileModel.findById(fileId);

    if (!file) {
      console.log(
        `[${requestId}] [getFileById] File not found with ID:`,
        fileId
      );
      res.status(404).json({ message: "File not found" });
      return;
    }

    // Check if file has expired
    if (file.expiresAt < new Date()) {
      console.log(`[${requestId}] [getFileById] File has expired:`, {
        fileId,
        expiredAt: file.expiresAt,
      });
      res.status(410).json({ message: "This file has expired" });
      return;
    }

    // Generate a fresh download URL
    console.log(
      `[${requestId}] [getFileById] Generating fresh download URL for file:`,
      file.s3Key
    );
    const downloadUrl = await generateDownloadUrl(
      file.s3Key,
      file.originalName,
      file.validityHours * 60 * 60
    );

    file.downloadUrl = downloadUrl;
    await file.save();
    console.log(
      `[${requestId}] [getFileById] File record updated with fresh download URL`
    );

    const response = {
      fileId: file._id,
      fileName: file.originalName,
      fileSize: file.size,
      expiresAt: file.expiresAt,
      isPremium: file.isPremium,
      validityHours: file.validityHours,
      uploadedAt: file.uploadedAt,
    };
    console.log(`[${requestId}] [getFileById] Success response:`, {
      fileId: file._id,
      fileName: file.originalName,
      fileSize: file.size,
      expiresAt: file.expiresAt,
      isPremium: file.isPremium,
    });
    res.status(200).json(response);
  } catch (error) {
    console.error(
      `[${requestId}] [getFileById] Error getting file details:`,
      error
    );
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
  const requestId = generateRequestId();
  console.log(`[${requestId}] [updateFile] Request received:`, {
    params: req.params,
    body: req.body,
    ip: req.ip,
  });

  try {
    const { fileId } = req.params;
    const { maxSize, validityHours, isPremium, paymentId } = req.body;

    console.log(`[${requestId}] [updateFile] Looking up file with ID:`, fileId);
    const file = await FileModel.findById(fileId);

    if (!file) {
      console.log(
        `[${requestId}] [updateFile] File not found with ID:`,
        fileId
      );
      res.status(404).json({ message: "File not found" });
      return;
    }

    // Update file attributes if provided
    let updates: Record<string, any> = {};
    if (maxSize) {
      file.maxSize = maxSize;
      updates.maxSize = maxSize;
    }
    if (validityHours) {
      // Update expiry time based on new validity
      const newExpiryTime = new Date(
        file.uploadedAt.getTime() + validityHours * 60 * 60 * 1000
      );
      file.validityHours = validityHours;
      file.expiresAt = newExpiryTime;
      updates.validityHours = validityHours;
      updates.expiresAt = newExpiryTime;
    }
    if (isPremium !== undefined) {
      file.isPremium = isPremium;
      updates.isPremium = isPremium;
    }
    if (paymentId) {
      // Convert paymentId string to ObjectId before assigning
      file.paymentId = new mongoose.Types.ObjectId(paymentId);
      updates.paymentId = paymentId;
    }

    console.log(
      `[${requestId}] [updateFile] Updating file with attributes:`,
      updates
    );
    await file.save();

    // Generate a fresh download URL with new expiry time
    console.log(
      `[${requestId}] [updateFile] Generating fresh download URL with new expiry:`,
      file.validityHours
    );
    const downloadUrl = await generateDownloadUrl(
      file.s3Key,
      file.originalName,
      file.validityHours * 60 * 60
    );

    file.downloadUrl = downloadUrl;
    await file.save();
    console.log(
      `[${requestId}] [updateFile] File record updated with fresh download URL`
    );

    const response = {
      fileId: file._id,
      fileName: file.originalName,
      fileSize: file.size,
      maxSize: file.maxSize,
      validityHours: file.validityHours,
      expiresAt: file.expiresAt,
      isPremium: file.isPremium,
    };
    console.log(`[${requestId}] [updateFile] Success response:`, {
      fileId: file._id,
      maxSize: file.maxSize,
      validityHours: file.validityHours,
      expiresAt: file.expiresAt,
      isPremium: file.isPremium,
    });
    res.status(200).json(response);
  } catch (error) {
    console.error(`[${requestId}] [updateFile] Error updating file:`, error);
    res.status(500).json({ message: "Error updating file" });
  }
};

/**
 * Get file details by userID
 * @route GET /api/files/:userId
 */
const getFilesByUserId = async (
  req: Request<{}, {}, UpdateFileRequestBody>,
  res: Response
): Promise<void> => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] [updateFile] Request received:`, {
    params: req.params,
    body: req.body,
    ip: req.ip,
  });
  if (!req.user) {
    console.log(`[${requestId}] [updateFile] User not authenticated`);
    res.status(403).json({ message: "User not authenticated" });
    return;
  }

  const { id: userId } = req.user;

  try {
    const files = await FileModel.find({ userId });

    if (!files || files.length === 0) {
      console.log(
        `[${requestId}] [updateFile] No files found for userId:`,
        userId
      );
      res.status(404).json({ message: "No files found for this user" });
      return;
    }

    console.log(
      `[${requestId}] [updateFile] Found ${files.length} files for userId:`,
      userId
    );

    const response = files.map((file) => ({
      id: file._id,
      name: file.originalName,
      fileSize: file.size,
      expiresAt: file.expiresAt,
      isPremium: file.isPremium,
      uploadedAt: file.uploadedAt,
      size: file.size,
    }));

    res.status(200).json(response);
    console.log(`[${requestId}] [updateFile] Success response:`, response);
  } catch (error) {
    console.error(
      `[${requestId}] [updateFile] Error getting files by userId:`,
      error
    );
    res.status(500).json({ message: "Error getting files by userId" });
  }
};

export {
  getUploadUrl,
  confirmUpload,
  getFileById,
  updateFile,
  getFilesByUserId,
  downloadFile,
};
