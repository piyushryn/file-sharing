import mongoose, { Document, Schema } from "mongoose";

export interface IPricingTier extends Document {
  name: string;
  description: string;
  fileSizeLimit: number;
  validityInHours: number;
  price: number;
  isActive: boolean;
  isDefault: boolean;
  currencyCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const pricingTierSchema = new Schema<IPricingTier>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  fileSizeLimit: {
    type: Number,
    required: true, // in GB
  },
  validityInHours: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true, // in INR
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  currencyCode: {
    type: String,
    default: "INR",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update updatedAt timestamp
pricingTierSchema.pre<IPricingTier>("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IPricingTier>("PricingTier", pricingTierSchema);
