import { OAuth2Client } from 'google-auth-library';
import { env, isGoogleAuthEnabled } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

let client: OAuth2Client | null = null;

const getClient = (): OAuth2Client => {
  if (!isGoogleAuthEnabled) throw new AppError('Google authentication is not configured', 501);
  if (!client) {
    client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  return client;
};

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
}

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleUserInfo> => {
  const c = getClient();
  try {
    const ticket = await c.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new AppError('Invalid Google ID token payload', 400);
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to verify Google ID token', 401);
  }
};
