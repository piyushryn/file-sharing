import { Request, Response } from "express";
import crypto from "crypto";
import { clearBucket } from "../utils/s3Config";
import FileModel from "../models/FileModel";

const adminKeyHeader = "x-admin-api-key";

// Helper function to generate request ID for tracking
const generateRequestId = () => crypto.randomBytes(8).toString("hex");

/**
 * Clear all objects from S3 bucket
 * @route POST /api/admin/clear-bucket
 */
const clearAllFiles = async (req: Request, res: Response): Promise<void> => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] [clearS3Bucket] Request received:`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userDetails: req.user,
    headers: req.headers,
  });

  try {
    // Check for admin API key (should be in environment variables)
    const apiKey = req.headers[adminKeyHeader];

    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      console.log(`[${requestId}] [clearS3Bucket] Invalid or missing API key`);
      res.status(401).json({ message: "Unauthorized: Invalid API key" });
      return;
    }

    console.log(
      `[${requestId}] [clearS3Bucket] Starting bucket clearing operation`
    );

    // Clear the S3 bucket
    const result = await clearBucket();

    // Also clear the file database records if successful
    if (result.deleted > 0) {
      await FileModel.deleteMany({});
      console.log(
        `[${requestId}] [clearS3Bucket] All file records deleted from database`
      );
    }

    console.log(`[${requestId}] [clearS3Bucket] Operation completed:`, {
      objectsDeleted: result.deleted,
      errors: result.errors,
    });

    res.status(200).json({
      message: "S3 bucket cleared successfully",
      objectsDeleted: result.deleted,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error(
      `[${requestId}] [clearS3Bucket] Error clearing bucket:`,
      error
    );
    res.status(500).json({
      message: "Error clearing S3 bucket",
      error: error.message,
    });
  }
};

export { clearAllFiles };
