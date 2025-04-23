import mongoose, { Document, Schema } from "mongoose";

// Define interface for File document
export interface IFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  downloadUrl?: string;
  expiresAt: Date;
  uploadedAt: Date;
  maxSize: number;
  validityHours: number;
  isPremium: boolean;
  email?: string | null;
  paymentId?: mongoose.Types.ObjectId | null;
}

const fileSchema = new Schema<IFile>({
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
    type: Schema.Types.ObjectId,
    ref: "Payment",
    default: null,
  },
});

// Create index for automatic deletion based on expiresAt field
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IFile>("File", fileSchema);
