import { getModel } from '../../ai/geminiClient';
import { logger } from '../../lib/logger';

interface ScreenHelpRequest {
  imageBase64: string;
  question: string;
  currentRoute: string;
}

const SYSTEM_PROMPT = `You are SenseiAI's screen assistant — a helpful AI that can see the user's current page and answer questions about it.

Context: The user is on a Japanese language learning platform called SenseiAI. The platform has pages for:
- Dashboard (progress overview, streaks, XP)
- Kana learning (Hiragana/Katakana character grids)
- Kanji learning (browseable by JLPT level)
- Grammar lessons (patterns with examples)
- Vocabulary (searchable word lists)
- SRS Flashcards (spaced repetition review)
- Mock Tests (JLPT practice tests)
- AI Tutor (chat-based Japanese teacher)

When the user shares their screen:
1. Identify what page/section they're looking at
2. Answer their specific question clearly and helpfully
3. If they seem confused about navigation, guide them step by step
4. If they're looking at Japanese content, help explain it
5. Keep responses concise but thorough (under 300 words)
6. Use simple language — many users are beginners

The current route is provided so you know which page they're on.`;

export const runScreenAssistant = async (request: ScreenHelpRequest): Promise<string> => {
  const model = getModel('capable');
  const prompt = `${SYSTEM_PROMPT}\n\nThe user is currently on route: ${request.currentRoute}\n\nUser's question: ${request.question}`;

  const base64Data = request.imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const mimeType = request.imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

  let retries = 3;
  let delay = 1000;

  while (retries > 0) {
    try {
      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType, data: base64Data } },
      ]);
      return result.response.text();
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      if ((status === 503 || status === 429) && retries > 1) {
        retries--;
        logger.warn(`Screen assistant hit ${status}. Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // exponential backoff
      } else {
        logger.error('Screen assistant error:', error);
        throw new Error('Failed to analyze screen. Please try again.');
      }
    }
  }

  throw new Error('Failed to analyze screen after retries.');
};
