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
import crypto from "crypto";

// Helper function to generate request ID for tracking
const generateRequestId = () => crypto.randomBytes(8).toString("hex");

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
  const requestId = generateRequestId();
  console.log(`[${requestId}] [getPricingTiers] Request received`);

  try {
    const pricingTiers = await PricingTierModel.find({ isActive: true });
    console.log(
      `[${requestId}] [getPricingTiers] Found ${pricingTiers.length} active pricing tiers`
    );

    res.status(200).json(pricingTiers);
  } catch (error) {
    console.error(
      `[${requestId}] [getPricingTiers] Error fetching pricing tiers:`,
      error
    );
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
  const requestId = generateRequestId();
  console.log(`[${requestId}] [initRazorpayPayment] Request received:`, {
    body: req.body,
    ip: req.ip,
  });

  try {
    const { fileId, pricingTierId } = req.body;

    // Validate file exists
    console.log(
      `[${requestId}] [initRazorpayPayment] Validating file exists, ID:`,
      fileId
    );
    const file = await FileModel.findById(fileId);
    if (!file) {
      console.log(
        `[${requestId}] [initRazorpayPayment] File not found with ID:`,
        fileId
      );
      res.status(404).json({ message: "File not found" });
      return;
    }

    // Get pricing tier details
    console.log(
      `[${requestId}] [initRazorpayPayment] Getting pricing tier details, ID:`,
      pricingTierId
    );
    const pricingTier = await PricingTierModel.findById(pricingTierId);
    if (!pricingTier || !pricingTier.isActive) {
      console.log(
        `[${requestId}] [initRazorpayPayment] Invalid or inactive pricing tier:`,
        pricingTierId
      );
      res.status(404).json({ message: "Invalid or inactive pricing tier" });
      return;
    }

    // Create Razorpay order
    console.log(
      `[${requestId}] [initRazorpayPayment] Creating Razorpay order, amount:`,
      pricingTier.price
    );
    const order = await createOrder(
      pricingTier.price,
      pricingTier.currencyCode,
      `File-${fileId}`
    );
    console.log(
      `[${requestId}] [initRazorpayPayment] Razorpay order created:`,
      order.id
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
    console.log(
      `[${requestId}] [initRazorpayPayment] Payment record created in DB, ID:`,
      payment._id
    );

    const response = {
      paymentId: payment._id,
      orderId: order.id,
      amount: pricingTier.price,
      currency: pricingTier.currencyCode,
      keyId: process.env.RAZORPAY_KEY_ID,
    };

    console.log(`[${requestId}] [initRazorpayPayment] Success response:`, {
      paymentId: payment._id,
      orderId: order.id,
      amount: pricingTier.price,
      currency: pricingTier.currencyCode,
    });
    res.status(200).json(response);
  } catch (error) {
    console.error(
      `[${requestId}] [initRazorpayPayment] Error initializing Razorpay payment:`,
      error
    );
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
  const requestId = generateRequestId();
  console.log(`[${requestId}] [verifyRazorpayPayment] Request received:`, {
    body: req.body,
    ip: req.ip,
  });

  try {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;

    // Verify signature
    console.log(
      `[${requestId}] [verifyRazorpayPayment] Verifying Razorpay signature for order:`,
      razorpayOrderId
    );
    const isValidSignature = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValidSignature) {
      console.log(
        `[${requestId}] [verifyRazorpayPayment] Invalid payment signature`
      );
      res.status(400).json({ message: "Invalid payment signature" });
      return;
    }
    console.log(
      `[${requestId}] [verifyRazorpayPayment] Signature verification successful`
    );

    // Update payment record
    console.log(
      `[${requestId}] [verifyRazorpayPayment] Updating payment record, ID:`,
      paymentId
    );
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      console.log(
        `[${requestId}] [verifyRazorpayPayment] Payment not found with ID:`,
        paymentId
      );
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    payment.gatewayPaymentId = razorpayPaymentId;
    payment.status = "successful";
    await payment.save();
    console.log(
      `[${requestId}] [verifyRazorpayPayment] Payment status updated to successful`
    );

    // Update file with new attributes from the pricing tier
    console.log(
      `[${requestId}] [verifyRazorpayPayment] Getting pricing tier:`,
      payment.pricingTierId
    );
    const pricingTier = await PricingTierModel.findById(payment.pricingTierId);

    if (pricingTier) {
      console.log(
        `[${requestId}] [verifyRazorpayPayment] Updating file attributes for file:`,
        payment.fileId
      );
      // Update file attributes
      const updateResult = await FileModel.findByIdAndUpdate(payment.fileId, {
        maxSize: pricingTier.fileSizeLimit,
        validityHours: pricingTier.validityInHours,
        isPremium: true,
        paymentId: payment._id,
        // Update expiry time based on new validity
        expiresAt: new Date(
          Date.now() + pricingTier.validityInHours * 60 * 60 * 1000
        ),
      });
      console.log(
        `[${requestId}] [verifyRazorpayPayment] File update result:`,
        !!updateResult
      );
    }

    const response = {
      success: true,
      message: "Payment verified successfully",
      fileId: payment.fileId,
      paymentId: payment._id,
    };

    console.log(
      `[${requestId}] [verifyRazorpayPayment] Success response:`,
      response
    );
    res.status(200).json(response);
  } catch (error) {
    console.error(
      `[${requestId}] [verifyRazorpayPayment] Error verifying Razorpay payment:`,
      error
    );
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
  const requestId = generateRequestId();
  console.log(`[${requestId}] [initStripePayment] Request received:`, {
    body: req.body,
    ip: req.ip,
  });

  try {
    const { fileId, pricingTierId, currency: requestCurrency } = req.body;

    // Validate file exists
    console.log(
      `[${requestId}] [initStripePayment] Validating file exists, ID:`,
      fileId
    );
    const file = await FileModel.findById(fileId);
    if (!file) {
      console.log(
        `[${requestId}] [initStripePayment] File not found with ID:`,
        fileId
      );
      res.status(404).json({ message: "File not found" });
      return;
    }

    // Get pricing tier details
    console.log(
      `[${requestId}] [initStripePayment] Getting pricing tier details, ID:`,
      pricingTierId
    );
    const pricingTier = await PricingTierModel.findById(pricingTierId);
    if (!pricingTier || !pricingTier.isActive) {
      console.log(
        `[${requestId}] [initStripePayment] Invalid or inactive pricing tier:`,
        pricingTierId
      );
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
      console.log(
        `[${requestId}] [initStripePayment] Currency conversion: INR to USD, converted amount:`,
        amount
      );
    }

    // Create Stripe payment intent
    console.log(
      `[${requestId}] [initStripePayment] Creating Stripe payment intent:`,
      { amount, currency }
    );
    const paymentIntent = await createPaymentIntent(amount, currency, {
      fileId: fileId.toString(),
      pricingTierId: pricingTierId.toString(),
    });
    console.log(
      `[${requestId}] [initStripePayment] Stripe payment intent created, ID:`,
      paymentIntent.id
    );

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
    console.log(
      `[${requestId}] [initStripePayment] Payment record created in DB, ID:`,
      payment._id
    );

    const response = {
      paymentId: payment._id,
      clientSecret: paymentIntent.client_secret,
      publicKey: process.env.STRIPE_PUBLIC_KEY,
      amount,
      currency,
    };

    console.log(
      `[${requestId}] [initStripePayment] Success response (client secret hidden):`,
      {
        paymentId: payment._id,
        publicKey: process.env.STRIPE_PUBLIC_KEY,
        amount,
        currency,
      }
    );
    res.status(200).json(response);
  } catch (error) {
    console.error(
      `[${requestId}] [initStripePayment] Error initializing Stripe payment:`,
      error
    );
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
  const requestId = generateRequestId();
  console.log(`[${requestId}] [handleStripeWebhook] Webhook received:`, {
    headers: {
      "stripe-signature":
        req.headers["stripe-signature"]?.toString().substring(0, 10) + "...",
    },
  });

  let event;

  try {
    // Use raw body instead of parsed JSON for Stripe signature verification
    const payload = req.rawBody || "";

    if (!payload) {
      console.log(
        `[${requestId}] [handleStripeWebhook] Missing raw body in request`
      );
    }

    if (!req.headers["stripe-signature"]) {
      console.log(
        `[${requestId}] [handleStripeWebhook] Missing Stripe signature in headers`
      );
      res.status(400).json({ message: "Missing stripe signature" });
      return;
    }

    // Verify webhook signature
    console.log(
      `[${requestId}] [handleStripeWebhook] Verifying webhook signature`
    );
    event = verifyWebhookSignature(
      payload,
      req.headers["stripe-signature"] as string
    );

    console.log(`[${requestId}] [handleStripeWebhook] Event type:`, event.type);

    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      // Get metadata from payment intent
      const { fileId, pricingTierId } = paymentIntent.metadata;
      console.log(
        `[${requestId}] [handleStripeWebhook] Payment succeeded for:`,
        { fileId, pricingTierId }
      );

      // Find payment record by payment intent ID
      const payment = await PaymentModel.findOne({
        gatewayPaymentId: paymentIntent.id,
      });

      if (payment) {
        // Update payment status
        payment.status = "successful";
        await payment.save();
        console.log(
          `[${requestId}] [handleStripeWebhook] Payment status updated to successful, ID:`,
          payment._id
        );

        // Get pricing tier details
        const pricingTier = await PricingTierModel.findById(pricingTierId);

        // Update file attributes
        if (pricingTier && fileId) {
          console.log(
            `[${requestId}] [handleStripeWebhook] Updating file attributes for file:`,
            fileId
          );
          const updateResult = await FileModel.findByIdAndUpdate(fileId, {
            maxSize: pricingTier.fileSizeLimit,
            validityHours: pricingTier.validityInHours,
            isPremium: true,
            paymentId: payment._id,
            expiresAt: new Date(
              Date.now() + pricingTier.validityInHours * 60 * 60 * 1000
            ),
          });
          console.log(
            `[${requestId}] [handleStripeWebhook] File update result:`,
            !!updateResult
          );
        }
      } else {
        console.log(
          `[${requestId}] [handleStripeWebhook] No payment record found for payment intent:`,
          paymentIntent.id
        );
      }
    }

    // Return a 200 success response
    console.log(
      `[${requestId}] [handleStripeWebhook] Webhook processed successfully`
    );
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error(
      `[${requestId}] [handleStripeWebhook] Error handling Stripe webhook:`,
      error
    );
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
  const requestId = generateRequestId();
  console.log(`[${requestId}] [checkPaymentStatus] Request received:`, {
    params: req.params,
    ip: req.ip,
  });

  try {
    const { paymentId } = req.params;

    console.log(
      `[${requestId}] [checkPaymentStatus] Looking up payment with ID:`,
      paymentId
    );
    const payment = await PaymentModel.findById(paymentId);

    if (!payment) {
      console.log(
        `[${requestId}] [checkPaymentStatus] Payment not found with ID:`,
        paymentId
      );
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    console.log(
      `[${requestId}] [checkPaymentStatus] Payment found, status:`,
      payment.status
    );

    // For Stripe, verify payment status directly from Stripe API if needed
    if (payment.paymentGateway === "stripe" && payment.status === "created") {
      console.log(
        `[${requestId}] [checkPaymentStatus] Verifying Stripe payment status from API:`,
        payment.gatewayPaymentId
      );
      const paymentIntent = await retrievePaymentIntent(
        payment.gatewayPaymentId
      );

      console.log(
        `[${requestId}] [checkPaymentStatus] Stripe payment status:`,
        paymentIntent.status
      );

      if (paymentIntent.status === "succeeded") {
        payment.status = "successful";
        await payment.save();
        console.log(
          `[${requestId}] [checkPaymentStatus] Payment status updated to successful`
        );

        // Update file if payment is successful
        console.log(
          `[${requestId}] [checkPaymentStatus] Getting pricing tier:`,
          payment.pricingTierId
        );
        const pricingTier = await PricingTierModel.findById(
          payment.pricingTierId
        );

        if (pricingTier) {
          console.log(
            `[${requestId}] [checkPaymentStatus] Updating file attributes for file:`,
            payment.fileId
          );
          const updateResult = await FileModel.findByIdAndUpdate(
            payment.fileId,
            {
              maxSize: pricingTier.fileSizeLimit,
              validityHours: pricingTier.validityInHours,
              isPremium: true,
              paymentId: payment._id,
              expiresAt: new Date(
                Date.now() + pricingTier.validityInHours * 60 * 60 * 1000
              ),
            }
          );
          console.log(
            `[${requestId}] [checkPaymentStatus] File update result:`,
            !!updateResult
          );
        }
      }
    }

    const response = {
      paymentId: payment._id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      fileId: payment.fileId,
    };

    console.log(
      `[${requestId}] [checkPaymentStatus] Success response:`,
      response
    );
    res.status(200).json(response);
  } catch (error) {
    console.error(
      `[${requestId}] [checkPaymentStatus] Error checking payment status:`,
      error
    );
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
