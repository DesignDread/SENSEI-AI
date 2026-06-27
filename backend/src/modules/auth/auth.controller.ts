import { Request, Response, NextFunction } from 'express';
import * as AuthService from './auth.service';
import { AuthRequest } from '../../middleware/authenticate';
import { AppError } from '../../middleware/errorHandler';
import { env, isGoogleAuthEnabled, isEmailOtpEnabled } from '../../config/env';
import { Profile } from '../../models/Profile';
import { User } from '../../models/User';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
};

const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens, requiresVerification } = await AuthService.registerUser(req.body);
    if (tokens) {
      setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    }
    res.status(201).json({
      message: requiresVerification ? 'Please check your email for a verification code' : 'Account created',
      data: {
        user: { id: user._id, email: user.email, isVerified: user.isVerified },
        requiresVerification,
      },
    });
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens, profile } = await AuthService.loginUser(req.body.email, req.body.password);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({
      message: 'Login successful',
      data: {
        user: { id: user._id, email: user.email, isVerified: user.isVerified },
        profile: profile || null,
        hasProfile: !!profile,
      },
    });
  } catch (err) { next(err); }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens, profile, isNewUser, displayName } = await AuthService.loginWithGoogle(req.body.idToken);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({
      message: isNewUser ? 'Account created with Google' : 'Login successful',
      data: {
        user: { id: user._id, email: user.email, isVerified: user.isVerified },
        profile: profile || null,
        hasProfile: !!profile,
        isNewUser,
        suggestedName: displayName,
      },
    });
  } catch (err) { next(err); }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, tokens } = await AuthService.verifyOtp(req.body.email, req.body.code);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({
      message: 'Email verified successfully',
      data: { user: { id: user._id, email: user.email, isVerified: true } },
    });
  } catch (err) { next(err); }
};

export const resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await AuthService.resendOtp(req.body.email);
    res.json({ message: 'Verification code resent' });
  } catch (err) { next(err); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new AppError('Refresh token not found', 401);
    const { user, tokens } = await AuthService.refreshTokens(refreshToken);
    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ message: 'Token refreshed', data: { userId: user._id } });
  } catch (err) { next(err); }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.userId) await AuthService.logoutUser(req.userId);
    res.clearCookie('accessToken', COOKIE_OPTS);
    res.clearCookie('refreshToken', COOKIE_OPTS);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) throw new AppError('User not found', 404);
    const profile = await Profile.findOne({ userId: req.userId });
    res.json({
      data: {
        user: { id: user._id, email: user.email, isVerified: user.isVerified, authProvider: user.authProvider },
        profile: profile || null,
        hasProfile: !!profile,
      },
    });
  } catch (err) { next(err); }
};

export const setupProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await AuthService.setupProfile(req.userId!, req.body);
    res.json({ message: 'Profile saved', data: { profile } });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await AuthService.setupProfile(req.userId!, req.body);
    res.json({ message: 'Profile updated', data: { profile } });
  } catch (err) { next(err); }
};

/** Returns feature flags so the frontend knows what to render */
export const getConfig = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    data: {
      googleAuthEnabled: isGoogleAuthEnabled,
      emailOtpEnabled: isEmailOtpEnabled,
    },
  });
};
