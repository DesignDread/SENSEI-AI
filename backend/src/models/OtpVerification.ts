import mongoose, { Document, Schema } from 'mongoose';

export interface IOtpVerification extends Document {
  email: string;
  codeHash: string;
  purpose: 'signup_verification';
  attempts: number;
  expiresAt: Date;
}

const OtpVerificationSchema = new Schema<IOtpVerification>({
  email: { type: String, required: true, lowercase: true, trim: true },
  codeHash: { type: String, required: true },
  purpose: { type: String, enum: ['signup_verification'], default: 'signup_verification' },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

OtpVerificationSchema.index({ email: 1 });
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpVerification = mongoose.model<IOtpVerification>('OtpVerification', OtpVerificationSchema);
