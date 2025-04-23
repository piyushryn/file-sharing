const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    default: "INR",
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
  },
  paymentGateway: {
    type: String,
    enum: ["razorpay", "stripe"],
    required: true,
  },
  gatewayPaymentId: {
    type: String,
    required: true,
  },
  gatewayOrderId: {
    type: String,
  },
  status: {
    type: String,
    enum: ["created", "failed", "successful"],
    default: "created",
  },
  pricingTierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PricingTier",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
