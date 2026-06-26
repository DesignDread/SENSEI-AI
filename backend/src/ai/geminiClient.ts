import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { env } from '../config/env';

let genAI: GoogleGenerativeAI | null = null;

const getGenAI = (): GoogleGenerativeAI => {
  if (!genAI) {
    if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAI;
};

export type ModelTier = 'fast' | 'capable';

const MODEL_MAP: Record<ModelTier, string> = {
  fast: 'gemini-2.5-flash',
  capable: 'gemini-2.5-flash',
};

export const getModel = (tier: ModelTier = 'capable'): GenerativeModel => {
  return getGenAI().getGenerativeModel({ model: MODEL_MAP[tier] });
};

export const generateText = async (
  prompt: string,
  tier: ModelTier = 'capable',
  config?: GenerationConfig
): Promise<string> => {
  const model = getModel(tier);
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: config,
  });
  return result.response.text();
};

export const generateJSON = async <T = unknown>(
  prompt: string,
  tier: ModelTier = 'capable'
): Promise<T> => {
  const model = getModel(tier);
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  const text = result.response.text();
  return JSON.parse(text) as T;
};

export const streamText = async function* (
  prompt: string,
  tier: ModelTier = 'capable'
): AsyncGenerator<string> {
  const model = getModel(tier);
  const result = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
};
