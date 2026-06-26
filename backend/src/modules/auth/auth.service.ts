import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User';
import { Profile } from '../../models/Profile';
import { UserProgress } from '../../models/UserProgress';
import { env, isEmailOtpEnabled } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { generateAndSendOtp, verifyOtp as verifyOtpCode } from './otp.service';
import { verifyGoogleIdToken } from './google.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const signTokens = (userId: string, tokenVersion: number): TokenPair => {
  const accessToken = jwt.sign(
    { userId },
    env.JWT_ACCESS_SECRET as string,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
  );
  const refreshToken = jwt.sign(
    { userId, version: tokenVersion },
    env.JWT_REFRESH_SECRET as string,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
  );
  return { accessToken, refreshToken };
};

export const registerUser = async (data: { email: string; password: string }) => {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(data.password, 12);
  const isVerified = !isEmailOtpEnabled; // Auto-verify if OTP not configured

  const user = await User.create({
    email: data.email.toLowerCase(),
    passwordHash,
    authProvider: 'password',
    isVerified,
  });

  // Create user progress
  await UserProgress.create({ userId: user._id });

  // Send OTP if email is configured
  if (isEmailOtpEnabled) {
    await generateAndSendOtp(data.email);
  }

  // Only return tokens if auto-verified (no OTP)
  if (isVerified) {
    const tokens = signTokens(user._id.toString(), user.refreshTokenVersion);
    return { user, tokens, requiresVerification: false };
  }

  return { user, tokens: null, requiresVerification: true };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) throw new AppError('Invalid email or password', 401);
  if (user.authProvider === 'google') throw new AppError('This account uses Google sign-in', 400);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  if (!user.isVerified) {
    // Resend OTP if not verified
    if (isEmailOtpEnabled) await generateAndSendOtp(email);
    throw new AppError('Please verify your email first', 403);
  }

  const tokens = signTokens(user._id.toString(), user.refreshTokenVersion);
  const profile = await Profile.findOne({ userId: user._id });
  return { user, tokens, profile };
};

export const loginWithGoogle = async (idToken: string) => {
  const googleUser = await verifyGoogleIdToken(idToken);

  let user = await User.findOne({ googleId: googleUser.googleId });
  let isNewUser = false;

  if (!user) {
    // Check if email exists with password auth
    const existingByEmail = await User.findOne({ email: googleUser.email.toLowerCase() });
    if (existingByEmail) {
      // Link Google to existing account
      existingByEmail.googleId = googleUser.googleId;
      existingByEmail.isVerified = true;
      await existingByEmail.save();
      user = existingByEmail;
    } else {
      // Create new user
      user = await User.create({
        email: googleUser.email.toLowerCase(),
        authProvider: 'google',
        googleId: googleUser.googleId,
        isVerified: true,
      });
      await UserProgress.create({ userId: user._id });
      isNewUser = true;
    }
  }

  const tokens = signTokens(user._id.toString(), user.refreshTokenVersion);
  const profile = await Profile.findOne({ userId: user._id });
  return { user, tokens, profile, isNewUser, displayName: googleUser.name };
};

export const verifyOtp = async (email: string, code: string) => {
  await verifyOtpCode(email, code);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('User not found', 404);

  user.isVerified = true;
  await user.save();

  const tokens = signTokens(user._id.toString(), user.refreshTokenVersion);
  return { user, tokens };
};

export const resendOtp = async (email: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('User not found', 404);
  if (user.isVerified) throw new AppError('Email already verified', 400);

  await generateAndSendOtp(email);
};

export const refreshTokens = async (refreshToken: string) => {
  let decoded: { userId: string; version: number };
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as typeof decoded;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.userId);
  if (!user || user.refreshTokenVersion !== decoded.version) {
    // Token reuse or version mismatch — bump version to invalidate all tokens
    if (user) {
      user.refreshTokenVersion += 1;
      await user.save();
    }
    throw new AppError('Token reuse detected. Please log in again.', 401);
  }

  const tokens = signTokens(user._id.toString(), user.refreshTokenVersion);
  return { user, tokens };
};

export const logoutUser = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { $inc: { refreshTokenVersion: 1 } });
};

import { Kanji } from '../../models/Kanji';
import { Vocabulary } from '../../models/Vocabulary';
import { SrsCard } from '../../models/SrsCard';

export const setupProfile = async (
  userId: string,
  data: {
    displayName: string;
    currentLevels?: {
      kana?: string;
      kanji?: string;
      vocabulary?: string;
      grammar?: string;
    };
    dailyGoalMinutes?: number;
    timezone?: string;
  }
) => {
  const existing = await Profile.findOne({ userId });
  if (existing) {
    // Update existing profile
    if (data.displayName) existing.displayName = data.displayName;
    if (data.currentLevels) {
      if (data.currentLevels.kana) existing.currentLevels.kana = data.currentLevels.kana as any;
      if (data.currentLevels.kanji) existing.currentLevels.kanji = data.currentLevels.kanji as any;
      if (data.currentLevels.vocabulary) existing.currentLevels.vocabulary = data.currentLevels.vocabulary as any;
      if (data.currentLevels.grammar) existing.currentLevels.grammar = data.currentLevels.grammar as any;
    }
    if (data.dailyGoalMinutes !== undefined) existing.dailyGoalMinutes = data.dailyGoalMinutes;
    if (data.timezone) existing.timezone = data.timezone;
    await existing.save();
    return existing;
  }

  const newProfile = await Profile.create({
    userId,
    displayName: data.displayName,
    currentLevels: data.currentLevels || {},
    dailyGoalMinutes: data.dailyGoalMinutes || 15,
    timezone: data.timezone || 'Asia/Kolkata',
  });

  // Seed 10 initial N5 Kanji and 10 initial N5 Vocab into SRS for new profiles
  try {
    const kanjis = await Kanji.find({ jlptLevel: 'N5' }).limit(10).lean();
    const vocabs = await Vocabulary.find({ jlptLevel: 'N5' }).limit(10).lean();

    const initialCards = [
      ...kanjis.map(k => ({
        userId: newProfile.userId,
        itemType: 'kanji',
        itemId: k._id,
      })),
      ...vocabs.map(v => ({
        userId: newProfile.userId,
        itemType: 'vocab',
        itemId: v._id,
      }))
    ];

    if (initialCards.length > 0) {
      await SrsCard.insertMany(initialCards, { ordered: false }).catch(() => {}); // ignore duplicates if any
    }
  } catch (err) {
    // silently fail SRS seeding to not break profile creation
    console.error('Failed to seed initial SRS cards:', err);
  }

  return newProfile;
};
