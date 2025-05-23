import axios, { AxiosResponse, AxiosProgressEvent } from "axios";

// Create axios instance with base URL
export const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:9876/api",
  timeout: 30000, // 30 seconds timeout
});

API.interceptors.request.use(
  (config) => {
    // Add authorization token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request error
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);
API.interceptors.response.use(
  (response) => {
    // Handle successful response
    return response;
  },
  (error) => {
    // Handle response error
    if (error.response) {
      // Server responded with a status code outside the range of 2xx
      console.error("Response error:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    return Promise.reject(error);
  }
);
// Define interfaces for API responses and requests
export interface FileUploadUrlResponse {
  uploadUrl: string;
  fileId: string;
  expiresAt: string;
}

interface FileConfirmResponse {
  fileId: string;
  expiresAt: string;
}

export interface FileDetails {
  id: string;
  fileName: string;
  fileSize: number;
  expiresAt: string;
  isPremium: boolean;
  validityHours: number;
  uploadedAt: string;
  email: string | null;
}

interface FileUpdateData {
  maxSize?: number;
  validityHours?: number;
  isPremium?: boolean;
  paymentId?: string;
}

export interface PricingTier {
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
