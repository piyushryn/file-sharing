const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const dotenv = require("dotenv");

dotenv.config();

/**
 * Create a payment intent in Stripe
 * @param {number} amount - Amount in cents (multiply USD by 100)
 * @param {string} currency - Currency code (default: USD)
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Object>} Stripe payment intent
 */
const createPaymentIntent = async (amount, currency = "USD", metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe takes amount in cents
      currency: currency,
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error("Error creating Stripe payment intent:", error);
    throw error;
  }
};

/**
 * Verify Stripe webhook signature
 * @param {Object} requestBody - Raw request body
 * @param {string} signature - Stripe signature from headers
 * @returns {Object} Event object if signature is valid
 */
const verifyWebhookSignature = (requestBody, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      requestBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error("Error verifying Stripe webhook signature:", error);
    throw error;
  }
};

/**
 * Retrieve payment intent information
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Payment intent object
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error("Error retrieving Stripe payment intent:", error);
    throw error;
  }
};

module.exports = {
  stripe,
  createPaymentIntent,
  verifyWebhookSignature,
  retrievePaymentIntent,
};
