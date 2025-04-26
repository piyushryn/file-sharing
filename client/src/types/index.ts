// File-related types
export interface FileInfo {
  fileId: string;
  fileName: string;
  fileSize: number;
  expiresAt: string;
  uploadedAt: string;
  isPremium: boolean;
  validityHours: number;
  maxSize?: number;
}

// Payment-related types
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

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Window augmentation for external payment APIs
declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): {
        open(): void;
      };
    };
  }
}
