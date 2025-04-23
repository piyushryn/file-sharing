import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Define RazorpayOrder interface
interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

// Initialize Razorpay with API keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

/**
 * Create a new order in Razorpay
 * @param {number} amount - Amount in paise (multiply INR by 100)
 * @param {string} currency - Currency code (default: INR)
 * @param {string} receipt - Optional receipt ID
 * @returns {Promise<RazorpayOrder>} Razorpay order object
 */
const createOrder = async (
  amount: number,
  currency: string = "INR",
  receipt: string = ""
): Promise<RazorpayOrder> => {
  try {
    const options = {
      amount: amount * 100, // Razorpay takes amount in paise
      currency,
      receipt,
      payment_capture: 1, // Auto-capture
    };

    const order = await razorpay.orders.create(options);
    return order as RazorpayOrder;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
};

/**
 * Verify payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Is signature valid
 */
const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  try {
    const hmac = crypto.createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET || ""
    );
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Error verifying Razorpay payment signature:", error);
    return false;
  }
};

export { razorpay, createOrder, verifyPaymentSignature };
