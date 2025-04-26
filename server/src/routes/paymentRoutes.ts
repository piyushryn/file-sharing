import express from "express";
import {
  getPricingTiers,
  initRazorpayPayment,
  verifyRazorpayPayment,
  initStripePayment,
  handleStripeWebhook,
  checkPaymentStatus,
} from "../controllers/paymentController";
import { authenticateJWT } from "../middlewares/auth/authMiddleware";

const router = express.Router();

// Get pricing tiers
router.get("/pricing-tiers", getPricingTiers);

// Middleware to authenticate JWT token
router.use(authenticateJWT);

// Razorpay payment routes
router.post("/razorpay/init", initRazorpayPayment);
router.post("/razorpay/verify", verifyRazorpayPayment);

// Stripe payment routes
router.post("/stripe/init", initStripePayment);
router.post("/stripe/webhook", handleStripeWebhook);

// Check payment status
router.get("/:paymentId/status", checkPaymentStatus);

export default router;
