import axios from "axios";

// Create axios instance with base URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 30000, // 30 seconds timeout
});

// File API endpoints
export const fileService = {
  // Get pre-signed URL for uploading file
  getUploadUrl: (fileName, fileType, fileSize) => {
    return API.post("/files/getUploadUrl", {
      fileName,
      fileType,
      fileSize,
    });
  },

  // Confirm file upload is complete
  confirmUpload: (fileId, email = null) => {
    return API.post(`/files/confirmUpload/${fileId}`, { email });
  },

  // Get file details by ID
  getFileById: (fileId) => {
    return API.get(`/files/${fileId}`);
  },

  // Update file properties (after payment)
  updateFile: (fileId, data) => {
    return API.patch(`/files/${fileId}`, data);
  },
};

// Payment API endpoints
export const paymentService = {
  // Get all active pricing tiers
  getPricingTiers: () => {
    return API.get("/payments/pricing-tiers");
  },

  // Initialize Razorpay payment
  initRazorpayPayment: (fileId, pricingTierId) => {
    return API.post("/payments/razorpay/init", {
      fileId,
      pricingTierId,
    });
  },

  // Verify Razorpay payment
  verifyRazorpayPayment: (
    paymentId,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature
  ) => {
    return API.post("/payments/razorpay/verify", {
      paymentId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    });
  },

  // Initialize Stripe payment
  initStripePayment: (fileId, pricingTierId, currency = "INR") => {
    return API.post("/payments/stripe/init", {
      fileId,
      pricingTierId,
      currency,
    });
  },

  // Check payment status
  checkPaymentStatus: (paymentId) => {
    return API.get(`/payments/${paymentId}/status`);
  },
};

// Direct file upload to S3 with pre-signed URL
export const uploadFileToS3 = async (file, uploadUrl, onProgressUpdate) => {
  try {
    const response = await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgressUpdate) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgressUpdate(percentCompleted);
        }
      },
    });
    return response;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
};
