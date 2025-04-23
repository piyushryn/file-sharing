const Razorpay = require("razorpay");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Razorpay with API keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a new order in Razorpay
 * @param {number} amount - Amount in paise (multiply INR by 100)
 * @param {string} currency - Currency code (default: INR)
 * @param {string} receipt - Optional receipt ID
 * @returns {Promise<Object>} Razorpay order object
 */
const createOrder = async (amount, currency = "INR", receipt = "") => {
  try {
    const options = {
      amount: amount * 100, // Razorpay takes amount in paise
      currency,
      receipt,
      payment_capture: 1, // Auto-capture
    };

    const order = await razorpay.orders.create(options);
    return order;
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
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Error verifying Razorpay payment signature:", error);
    return false;
  }
};

module.exports = {
  razorpay,
  createOrder,
  verifyPaymentSignature,
};
