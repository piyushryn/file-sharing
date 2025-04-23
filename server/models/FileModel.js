const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  s3Key: {
    type: String,
    required: true,
  },
  downloadUrl: {
    type: String,
    // required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  maxSize: {
    type: Number,
    default: 2, // in GB
  },
  validityHours: {
    type: Number,
    default: 4,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email address",
    ],
    default: null,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    default: null,
  },
});

// Create index for automatic deletion based on expiresAt field
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("File", fileSchema);
