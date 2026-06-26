import { Router } from 'express';
import * as AuthController from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { authLimiter } from '../../middleware/rateLimiter';
import { validateRequest } from '../../middleware/validateRequest';
import { registerSchema, loginSchema, verifyOtpSchema, googleAuthSchema, setupProfileSchema } from './auth.validators';

const router = Router();

// Public auth routes
router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/google', authLimiter, validateRequest(googleAuthSchema), AuthController.googleLogin);
router.post('/verify-otp', authLimiter, validateRequest(verifyOtpSchema), AuthController.verifyOtp);
router.post('/resend-otp', authLimiter, AuthController.resendOtp);
router.post('/refresh', AuthController.refresh);
router.get('/config', AuthController.getConfig);

// Authenticated routes
router.post('/logout', authenticate, AuthController.logout);

// User profile routes (mounted under /users)
export const userRouter = Router();
userRouter.get('/me', authenticate, AuthController.getMe);
userRouter.post('/profile/setup', authenticate, validateRequest(setupProfileSchema), AuthController.setupProfile);
userRouter.patch('/profile', authenticate, validateRequest(setupProfileSchema), AuthController.updateProfile);

export default router;
