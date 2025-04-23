import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  //   apiVersion: "2022-11-15", // Use the appropriate API version
});

/**
 * Create a payment intent in Stripe
 * @param amount - Amount in cents (multiply USD by 100)
 * @param currency - Currency code (default: USD)
 * @param metadata - Optional metadata
 * @returns Stripe payment intent
 */
export const createPaymentIntent = async (
  amount: number,
  currency: string = "USD",
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> => {
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
 * @param requestBody - Raw request body
 * @param signature - Stripe signature from headers
 * @returns Event object if signature is valid
 */
export const verifyWebhookSignature = (
  requestBody: string | Buffer,
  signature: string
): Stripe.Event => {
  try {
    const event = stripe.webhooks.constructEvent(
      requestBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
    return event;
  } catch (error) {
    console.error("Error verifying Stripe webhook signature:", error);
    throw error;
  }
};

/**
 * Retrieve payment intent information
 * @param paymentIntentId - Stripe payment intent ID
 * @returns Payment intent object
 */
export const retrievePaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error("Error retrieving Stripe payment intent:", error);
    throw error;
  }
};

export { stripe };
