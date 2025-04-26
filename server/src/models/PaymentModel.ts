import mongoose, { Document, Schema } from "mongoose";

export type PaymentGateway = "razorpay" | "stripe";
export type PaymentStatus = "created" | "failed" | "successful";

export interface IPayment extends Document {
  amount: number;
  currency: string;
  fileId?: mongoose.Types.ObjectId;
  paymentGateway: PaymentGateway;
  gatewayPaymentId: string;
  gatewayOrderId?: string;
  status: PaymentStatus;
  pricingTierId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>({
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
    type: Schema.Types.ObjectId,
    ref: "File",
  },
  paymentGateway: {
    type: String,
    enum: ["razorpay", "stripe"],
    required: true,
  },
  gatewayPaymentId: {
    type: String,
    // required: true,
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
    type: Schema.Types.ObjectId,
    ref: "PricingTier",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IPayment>("Payment", paymentSchema);
