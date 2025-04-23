import axios, { AxiosResponse, AxiosProgressEvent } from "axios";

// Create axios instance with base URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 30000, // 30 seconds timeout
});

// Define interfaces for API responses and requests
interface FileUploadUrlResponse {
  uploadUrl: string;
  fileId: string;
  expiresAt: string;
}

interface FileConfirmResponse {
  fileId: string;
  downloadUrl: string;
  expiresAt: string;
}

interface FileDetails {
  fileId: string;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  expiresAt: string;
  isPremium: boolean;
  validityHours: number;
  uploadedAt: string;
}

interface FileUpdateData {
  maxSize?: number;
  validityHours?: number;
  isPremium?: boolean;
  paymentId?: string;
}

interface PricingTier {
  _id: string;
  name: string;
  description: string;
  fileSizeLimit: number;
  validityInHours: number;
  price: number;
  currencyCode: string;
  isActive: boolean;
  isDefault: boolean;
}

interface RazorpayInitResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface RazorpayVerifyResponse {
  success: boolean;
  message: string;
  fileId: string;
  paymentId: string;
}

interface StripeInitResponse {
  paymentId: string;
  clientSecret: string;
  publicKey: string;
  amount: number;
  currency: string;
}

interface PaymentStatusResponse {
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  fileId: string;
}

// File API endpoints
export const fileService = {
  // Get pre-signed URL for uploading file
  getUploadUrl: (
    fileName: string,
    fileType: string,
    fileSize: number
  ): Promise<AxiosResponse<FileUploadUrlResponse>> => {
    return API.post("/files/getUploadUrl", {
      fileName,
      fileType,
      fileSize,
    });
  },

  // Confirm file upload is complete
  confirmUpload: (
    fileId: string,
    email: string | null = null
  ): Promise<AxiosResponse<FileConfirmResponse>> => {
    return API.post(`/files/confirmUpload/${fileId}`, { email });
  },

  // Get file details by ID
  getFileById: (fileId: string): Promise<AxiosResponse<FileDetails>> => {
    return API.get(`/files/${fileId}`);
  },

  // Update file properties (after payment)
  updateFile: (
    fileId: string,
    data: FileUpdateData
  ): Promise<AxiosResponse<FileDetails>> => {
    return API.patch(`/files/${fileId}`, data);
  },
};

// Payment API endpoints
export const paymentService = {
  // Get all active pricing tiers
  getPricingTiers: (): Promise<AxiosResponse<PricingTier[]>> => {
    return API.get("/payments/pricing-tiers");
  },

  // Initialize Razorpay payment
  initRazorpayPayment: (
    fileId: string,
    pricingTierId: string
  ): Promise<AxiosResponse<RazorpayInitResponse>> => {
    return API.post("/payments/razorpay/init", {
      fileId,
      pricingTierId,
    });
  },

  // Verify Razorpay payment
  verifyRazorpayPayment: (
    paymentId: string,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string
  ): Promise<AxiosResponse<RazorpayVerifyResponse>> => {
    return API.post("/payments/razorpay/verify", {
      paymentId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    });
  },

  // Initialize Stripe payment
  initStripePayment: (
    fileId: string,
    pricingTierId: string,
    currency: string = "INR"
  ): Promise<AxiosResponse<StripeInitResponse>> => {
    return API.post("/payments/stripe/init", {
      fileId,
      pricingTierId,
      currency,
    });
  },

  // Check payment status
  checkPaymentStatus: (
    paymentId: string
  ): Promise<AxiosResponse<PaymentStatusResponse>> => {
    return API.get(`/payments/${paymentId}/status`);
  },
};

// Type for progress update callback
type OnProgressUpdate = (percentage: number) => void;

// Direct file upload to S3 with pre-signed URL
export const uploadFileToS3 = async (
  file: File,
  uploadUrl: string,
  onProgressUpdate?: OnProgressUpdate
): Promise<AxiosResponse> => {
  try {
    const response = await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgressUpdate && progressEvent.total) {
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
