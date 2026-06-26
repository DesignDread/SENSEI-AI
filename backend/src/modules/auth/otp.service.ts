import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OtpVerification } from '../../models/OtpVerification';
import { AppError } from '../../middleware/errorHandler';
import { sendOtpEmail } from './email.service';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export const generateAndSendOtp = async (email: string): Promise<void> => {
  // Delete any existing OTP for this email
  await OtpVerification.deleteMany({ email: email.toLowerCase() });

  // Generate 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = await bcrypt.hash(code, 10);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  await OtpVerification.create({
    email: email.toLowerCase(),
    codeHash,
    purpose: 'signup_verification',
    attempts: 0,
    expiresAt,
  });

  // Send email (fire-and-forget if SMTP not configured)
  await sendOtpEmail(email.toLowerCase(), code);
};

export const verifyOtp = async (email: string, code: string): Promise<boolean> => {
  const otp = await OtpVerification.findOne({
    email: email.toLowerCase(),
    purpose: 'signup_verification',
  });

  if (!otp) throw new AppError('No verification code found. Please request a new one.', 400);
  if (otp.expiresAt < new Date()) {
    await OtpVerification.deleteOne({ _id: otp._id });
    throw new AppError('Verification code has expired. Please request a new one.', 400);
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    await OtpVerification.deleteOne({ _id: otp._id });
    throw new AppError('Too many attempts. Please request a new code.', 429);
  }

  otp.attempts += 1;
  await otp.save();

  const isValid = await bcrypt.compare(code, otp.codeHash);
  if (!isValid) {
    throw new AppError(`Invalid code. ${MAX_ATTEMPTS - otp.attempts} attempts remaining.`, 400);
  }

  // Success — delete the OTP record
  await OtpVerification.deleteOne({ _id: otp._id });
  return true;
};
