import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { runTeacherAgent } from './agents/teacherAgent';
import { runQuizAgent } from './agents/quizAgent';
import { runScreenAssistant } from './agents/screenAssistantAgent';
import { AppError } from '../middleware/errorHandler';

// Simple intent classifier
const classifyIntent = (message: string): 'quiz' | 'teach' => {
  const quizKeywords = ['quiz', 'test me', 'practice', 'question', 'exercise', 'drill'];
  const lower = message.toLowerCase();
  if (quizKeywords.some((k) => lower.includes(k))) return 'quiz';
  return 'teach';
};

export const handleChat = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, sessionId } = req.body;
    if (!message) throw new AppError('Message is required', 400);

    const intent = classifyIntent(message);

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    if (intent === 'quiz') {
      const topic = message.replace(/quiz|test me|practice|question|exercise|drill/gi, '').trim() || 'general';
      sendEvent({ type: 'intent', value: 'quiz' });
      const questions = await runQuizAgent({
        userId: req.userId!,
        topic,
        level: 'N5',
        count: 3,
        sectionType: 'vocab',
      });
      sendEvent({ type: 'quiz', questions });
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Teacher agent with streaming
    sendEvent({ type: 'intent', value: 'teach' });
    const { sessionId: newSessionId, stream, onComplete } = await runTeacherAgent(
      req.userId!,
      message,
      sessionId
    );

    sendEvent({ type: 'session', sessionId: newSessionId });

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
      sendEvent({ type: 'chunk', content: chunk });
    }

    await onComplete(fullResponse);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    if (res.headersSent) {
      console.error('AI Stream Error:', err);
      res.end();
    } else {
      next(err);
    }
  }
};

export const generateQuiz = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { topic, level, count, sectionType } = req.body;
    const questions = await runQuizAgent({
      userId: req.userId!,
      topic: topic ?? 'general vocabulary',
      level: level ?? 'N5',
      count: count ?? 5,
      sectionType: sectionType ?? 'vocab',
    });
    res.json({ data: { questions } });
  } catch (err) {
    next(err);
  }
};

export const handleScreenHelp = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { imageBase64, question, currentRoute } = req.body;
    if (!imageBase64 || !question) throw new AppError('Image and question are required', 400);

    const answer = await runScreenAssistant({
      imageBase64,
      question,
      currentRoute: currentRoute || '/unknown',
    });

    res.json({ data: { answer } });
  } catch (err) {
    next(err);
  }
};

// AI routes
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { aiLimiter } from '../middleware/rateLimiter';

export const aiRouter = Router();
aiRouter.use(authenticate, aiLimiter);
aiRouter.post('/chat', handleChat);
aiRouter.post('/quiz/generate', generateQuiz);
aiRouter.post('/screen-help', handleScreenHelp);
