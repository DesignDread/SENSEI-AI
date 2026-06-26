import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const setupProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).max(50),
    currentLevels: z.object({
      kana: z.enum(['hiragana', 'katakana', 'both_complete']).optional(),
      kanji: z.enum(['N5', 'N4', 'N3', 'N2', 'N1']).optional(),
      vocabulary: z.enum(['N5', 'N4', 'N3', 'N2', 'N1']).optional(),
      grammar: z.enum(['N5', 'N4', 'N3', 'N2', 'N1']).optional(),
    }).optional(),
    dailyGoalMinutes: z.number().min(5).max(120).optional(),
    timezone: z.string().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
