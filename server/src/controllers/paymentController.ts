import { Request, Response } from "express";
import PaymentModel, { IPayment } from "../models/PaymentModel";
import PricingTierModel, { IPricingTier } from "../models/PricingTierModel";
import FileModel from "../models/FileModel";
import { createOrder, verifyPaymentSignature } from "../utils/razorpayConfig";
import {
  createPaymentIntent,
  verifyWebhookSignature,
  retrievePaymentIntent,
} from "../utils/stripeConfig";

interface InitPaymentRequestBody {
  fileId: string;
  pricingTierId: string;
  currency?: string;
}

interface VerifyRazorpayRequestBody {
  paymentId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

interface StripeWebhookRequest extends Request {
  rawBody?: string;
}

/**
 * Get all active pricing tiers
 * @route GET /api/payments/pricing-tiers
 */
const getPricingTiers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pricingTiers = await PricingTierModel.find({ isActive: true });
    res.status(200).json(pricingTiers);
  } catch (error) {
    console.error("Error fetching pricing tiers:", error);
    res.status(500).json({ message: "Error fetching pricing tiers" });
  }
};

/**
 * Initialize Razorpay payment
 * @route POST /api/payments/razorpay/init
 */
const initRazorpayPayment = async (
  req: Request<{}, {}, InitPaymentRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { fileId, pricingTierId } = req.body;

    // Validate file exists
    const file = await FileModel.findById(fileId);
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    // Get pricing tier details
    const pricingTier = await PricingTierModel.findById(pricingTierId);
    if (!pricingTier || !pricingTier.isActive) {
      res.status(404).json({ message: "Invalid or inactive pricing tier" });
      return;
    }

    // Create Razorpay order
    const order = await createOrder(
      pricingTier.price,
      pricingTier.currencyCode,
      `File-${fileId}`
    );

    // Create payment record
    const payment = new PaymentModel({
      amount: pricingTier.price,
      currency: pricingTier.currencyCode,
      fileId: fileId,
      paymentGateway: "razorpay",
      gatewayPaymentId: "", // Will be updated after payment
      gatewayOrderId: order.id,
      status: "created",
      pricingTierId: pricingTier._id,
    });

    await payment.save();

    res.status(200).json({
      paymentId: payment._id,
      orderId: order.id,
      amount: pricingTier.price,
      currency: pricingTier.currencyCode,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error initializing Razorpay payment:", error);
    res.status(500).json({ message: "Error initializing payment" });
  }
};

/**
 * Verify Razorpay payment
 * @route POST /api/payments/razorpay/verify
 */
const verifyRazorpayPayment = async (
  req: Request<{}, {}, VerifyRazorpayRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;

    // Verify signature
    const isValidSignature = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValidSignature) {
      res.status(400).json({ message: "Invalid payment signature" });
      return;
    }

    // Update payment record
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    payment.gatewayPaymentId = razorpayPaymentId;
    payment.status = "successful";
    await payment.save();

    // Update file with new attributes from the pricing tier
    const pricingTier = await PricingTierModel.findById(payment.pricingTierId);

    if (pricingTier) {
      // Update file attributes
      await FileModel.findByIdAndUpdate(payment.fileId, {
        maxSize: pricingTier.fileSizeLimit,
        validityHours: pricingTier.validityInHours,
        isPremium: true,
        paymentId: payment._id,
        // Update expiry time based on new validity
        expiresAt: new Date(
          Date.now() + pricingTier.validityInHours * 60 * 60 * 1000
        ),
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      fileId: payment.fileId,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({ message: "Error verifying payment" });
  }
};

/**
 * Initialize Stripe payment
 * @route POST /api/payments/stripe/init
 */
const initStripePayment = async (
  req: Request<{}, {}, InitPaymentRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { fileId, pricingTierId, currency: requestCurrency } = req.body;

    // Validate file exists
    const file = await FileModel.findById(fileId);
    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    // Get pricing tier details
    const pricingTier = await PricingTierModel.findById(pricingTierId);
    if (!pricingTier || !pricingTier.isActive) {
      res.status(404).json({ message: "Invalid or inactive pricing tier" });
      return;
    }

    // Convert INR to USD if needed (simplified conversion for example)
    let amount = pricingTier.price;
    let currency = pricingTier.currencyCode;

    // If pricing is in INR but payment is in USD, convert (simplified)
    if (pricingTier.currencyCode === "INR" && requestCurrency === "USD") {
      amount = Math.ceil(amount / 75); // Simple INR to USD conversion
      currency = "USD";
    }

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(amount, currency, {
      fileId: fileId.toString(),
      pricingTierId: pricingTierId.toString(),
    });

    // Create payment record
    const payment = new PaymentModel({
      amount: amount,
      currency: currency,
      fileId: fileId,
      paymentGateway: "stripe",
      gatewayPaymentId: paymentIntent.id,
      status: "created",
      pricingTierId: pricingTier._id,
    });

    await payment.save();

    res.status(200).json({
      paymentId: payment._id,
      clientSecret: paymentIntent.client_secret,
      publicKey: process.env.STRIPE_PUBLIC_KEY,
      amount,
      currency,
    });
  } catch (error) {
    console.error("Error initializing Stripe payment:", error);
    res.status(500).json({ message: "Error initializing payment" });
  }
};

/**
 * Handle Stripe webhook
 * @route POST /api/payments/stripe/webhook
 */
const handleStripeWebhook = async (
  req: StripeWebhookRequest,
  res: Response
): Promise<void> => {
  let event;

  try {
    // Use raw body instead of parsed JSON for Stripe signature verification
    const payload = req.rawBody || "";

    // Verify webhook signature
    event = verifyWebhookSignature(
      payload,
      req.headers["stripe-signature"] as string
    );

    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      // Get metadata from payment intent
      const { fileId, pricingTierId } = paymentIntent.metadata;

      // Find payment record by payment intent ID
      const payment = await PaymentModel.findOne({
        gatewayPaymentId: paymentIntent.id,
      });

      if (payment) {
        // Update payment status
        payment.status = "successful";
        await payment.save();

        // Get pricing tier details
        const pricingTier = await PricingTierModel.findById(pricingTierId);

        // Update file attributes
        if (pricingTier && fileId) {
          await FileModel.findByIdAndUpdate(fileId, {
            maxSize: pricingTier.fileSizeLimit,
            validityHours: pricingTier.validityInHours,
            isPremium: true,
            paymentId: payment._id,
            expiresAt: new Date(
              Date.now() + pricingTier.validityInHours * 60 * 60 * 1000
            ),
          });
        }
      }
    }

    // Return a 200 success response
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Error handling Stripe webhook:", error);
    res.status(400).json({ message: "Webhook error", error: error.message });
  }
};

/**
 * Check payment status
 * @route GET /api/payments/:paymentId/status
 */
const checkPaymentStatus = async (
  req: Request<{ paymentId: string }>,
  res: Response
): Promise<void> => {
  try {
    const { paymentId } = req.params;

    const payment = await PaymentModel.findById(paymentId);

    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    // For Stripe, verify payment status directly from Stripe API if needed
    if (payment.paymentGateway === "stripe" && payment.status === "created") {
      const paymentIntent = await retrievePaymentIntent(
        payment.gatewayPaymentId
      );

      if (paymentIntent.status === "succeeded") {
        payment.status = "successful";
        await payment.save();

        // Update file if payment is successful
        const pricingTier = await PricingTierModel.findById(
          payment.pricingTierId
        );

        if (pricingTier) {
          await FileModel.findByIdAndUpdate(payment.fileId, {
            maxSize: pricingTier.fileSizeLimit,
            validityHours: pricingTier.validityInHours,
            isPremium: true,
            paymentId: payment._id,
            expiresAt: new Date(
              Date.now() + pricingTier.validityInHours * 60 * 60 * 1000
            ),
          });
        }
      }
    }

    res.status(200).json({
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      fileId: payment.fileId,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({ message: "Error checking payment status" });
  }
};

export {
  getPricingTiers,
  initRazorpayPayment,
  verifyRazorpayPayment,
  initStripePayment,
  handleStripeWebhook,
  checkPaymentStatus,
};
