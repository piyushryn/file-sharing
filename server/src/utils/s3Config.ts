import AWS from "aws-sdk";
import dotenv from "dotenv";

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
  filename: string,
  contentType: string,
  expirySeconds: number = 3600
): Promise<string> => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME || "",
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
const generateDownloadUrl = async (
  key: string,
  originalName: string,
  expirySeconds: number = 3600
): Promise<string> => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME || "",
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
 * @returns {Promise<AWS.S3.DeleteObjectOutput>} Deletion result
 */
const deleteObject = async (
  key: string
): Promise<AWS.S3.DeleteObjectOutput> => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME || "",
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

/**
 * Clear all objects from an S3 bucket
 * @returns {Promise<{deleted: number, errors: number}>} Summary of deletion operation
 */
const clearBucket = async (): Promise<{ deleted: number; errors: number }> => {
  const bucketName = process.env.S3_BUCKET_NAME || "";
  let continuationToken: string | undefined = undefined;
  let totalDeleted = 0;
  let totalErrors = 0;

  try {
    // Continue listing and deleting objects until bucket is empty
    do {
      // List objects in the bucket (1000 at a time - S3 limit)
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      };

      const listedObjects = await s3.listObjectsV2(listParams).promise();

      if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
        console.log("No objects found in bucket");
        break;
      }

      // Create delete params with objects to delete
      const deleteParams: AWS.S3.DeleteObjectsRequest = {
        Bucket: bucketName,
        Delete: {
          Objects: listedObjects.Contents.map(({ Key }) => ({
            Key: Key || "",
          })),
          Quiet: false,
        },
      };

      // Delete the batch of objects
      const deleteResult = await s3.deleteObjects(deleteParams).promise();

      // Update counts
      if (deleteResult.Deleted) totalDeleted += deleteResult.Deleted.length;
      if (deleteResult.Errors) totalErrors += deleteResult.Errors.length;

      // Check if there are more objects to delete
      continuationToken = listedObjects.NextContinuationToken;
    } while (continuationToken);

    console.log(
      `Successfully cleared S3 bucket. Deleted: ${totalDeleted}, Errors: ${totalErrors}`
    );
    return { deleted: totalDeleted, errors: totalErrors };
  } catch (error) {
    console.error("Error clearing S3 bucket:", error);
    throw error;
  }
};

export {
  s3,
  generateUploadUrl,
  generateDownloadUrl,
  deleteObject,
  clearBucket,
};
