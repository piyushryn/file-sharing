const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Get pricing tiers
router.get("/pricing-tiers", paymentController.getPricingTiers);

// Razorpay payment routes
router.post("/razorpay/init", paymentController.initRazorpayPayment);
router.post("/razorpay/verify", paymentController.verifyRazorpayPayment);

// Stripe payment routes
router.post("/stripe/init", paymentController.initStripePayment);
router.post("/stripe/webhook", paymentController.handleStripeWebhook);

// Check payment status
router.get("/:paymentId/status", paymentController.checkPaymentStatus);

module.exports = router;
