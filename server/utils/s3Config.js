const AWS = require("aws-sdk");
const dotenv = require("dotenv");

dotenv.config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create S3 service object
const s3 = new AWS.S3();

/**
 * Generate a pre-signed URL for S3 file upload
 * @param {string} filename - Unique filename for S3 object
 * @param {string} contentType - Mime type of the file
 * @param {number} expirySeconds - URL expiration time in seconds
 * @returns {Promise<string>} Pre-signed URL
 */
const generateUploadUrl = async (
  filename,
  contentType,
  expirySeconds = 3600
) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: filename,
    ContentType: contentType,
    Expires: expirySeconds,
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
    return uploadUrl;
  } catch (error) {
    console.error("Error generating upload URL:", error);
    throw error;
  }
};

/**
 * Generate a pre-signed URL for S3 file download
 * @param {string} key - S3 object key
 * @param {string} originalName - Original filename
 * @param {number} expirySeconds - URL expiration time in seconds
 * @returns {Promise<string>} Pre-signed URL
 */
const generateDownloadUrl = async (key, originalName, expirySeconds = 3600) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(
      originalName
    )}"`,
    Expires: expirySeconds,
  };

  try {
    const downloadUrl = await s3.getSignedUrlPromise("getObject", params);
    return downloadUrl;
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw error;
  }
};

/**
 * Delete an object from S3
 * @param {string} key - S3 object key to delete
 * @returns {Promise<Object>} Deletion result
 */
const deleteObject = async (key) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  try {
    const result = await s3.deleteObject(params).promise();
    return result;
  } catch (error) {
    console.error("Error deleting object from S3:", error);
    throw error;
  }
};

module.exports = {
  s3,
  generateUploadUrl,
  generateDownloadUrl,
  deleteObject,
};
