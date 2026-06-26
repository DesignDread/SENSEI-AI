import { buildQuizPrompt } from '../prompts/quizPrompt';
import { generateJSON } from '../geminiClient';

interface QuizQuestion {
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  type: string;
  jlptLevel: string;
  sectionType: string;
}

interface QuizResponse {
  questions: QuizQuestion[];
}

export const runQuizAgent = async (params: {
  userId: string;
  topic: string;
  level: string;
  count?: number;
  sectionType?: string;
}): Promise<QuizQuestion[]> => {
  const prompt = buildQuizPrompt({
    topic: params.topic,
    level: params.level,
    count: params.count ?? 5,
    sectionType: params.sectionType ?? 'vocab',
  });

  const result = await generateJSON<QuizResponse>(prompt, 'capable');

  // Validate output
  if (!result.questions || !Array.isArray(result.questions)) {
    throw new Error('Invalid quiz response from AI');
  }

  const validated = result.questions.filter(
    (q) =>
      q.prompt &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.correctAnswer &&
      q.options.includes(q.correctAnswer)
  );

  return validated;
};
