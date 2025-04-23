const mongoose = require("mongoose");

const pricingTierSchema = new mongoose.Schema({
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
pricingTierSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("PricingTier", pricingTierSchema);
