import { buildTeacherPrompt } from '../prompts/teacherPrompt';
import { streamText } from '../geminiClient';
import { AgentSession } from '../../models/AgentSession';
import { UserProgress } from '../../models/UserProgress';
import { Profile } from '../../models/Profile';
import mongoose from 'mongoose';

export const runTeacherAgent = async (
  userId: string,
  question: string,
  sessionId?: string
) => {
  // Load user context
  const profile = await Profile.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
  const progress = await UserProgress.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();

  const recentMistakes: string[] = [];
  const level = profile?.currentLevels?.kanji || 'N5';

  // Save to agent session
  let session = sessionId
    ? await AgentSession.findById(sessionId)
    : null;

  if (!session) {
    session = await AgentSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      agentType: 'teacher',
      messages: [],
      contextSnapshot: { level, recentMistakes, masteryVector: {} },
    });
  }

  // extract history
  const history = session.messages.map(m => `${m.role === 'user' ? 'Student' : 'Sensei'}: ${m.content}`);

  const prompt = buildTeacherPrompt({
    question,
    level,
    recentMistakes,
    nativeLanguage: profile?.timezone ? 'en' : 'en', // default to en
    history,
  });

  session.messages.push({ role: 'user', content: question, timestamp: new Date() });

  return {
    sessionId: session._id.toString(),
    stream: streamText(prompt, 'capable'),
    onComplete: async (fullResponse: string) => {
      session!.messages.push({ role: 'agent', content: fullResponse, timestamp: new Date() });
      await session!.save();
    },
  };
};
