import { GrammarPoint, IGrammarPoint } from '../../models/GrammarPoint';
import { generateJSON } from '../../ai/geminiClient';
import { logger } from '../../lib/logger';

interface GeneratedGrammar {
  explanation: string;
  usageNotes: string;
  examples: { jp: string; reading: string; en: string }[];
}

const buildGrammarPrompt = (point: IGrammarPoint): string => `
You are a Japanese language teacher. Generate a clear, beginner-friendly explanation for the following grammar point.

**Grammar Point:** ${point.title}
**JLPT Level:** ${point.jlptLevel}
**Category:** ${point.category}
**Structure Pattern:** ${point.structurePattern}

Respond in JSON with exactly this structure:
{
  "explanation": "A clear 2-4 sentence explanation of what this grammar pattern means and when to use it. Write in your own words.",
  "usageNotes": "1-2 sentences of practical usage tips, common mistakes, or nuances.",
  "examples": [
    { "jp": "Japanese sentence using this pattern", "reading": "Full hiragana reading", "en": "English translation" },
    { "jp": "...", "reading": "...", "en": "..." },
    { "jp": "...", "reading": "...", "en": "..." }
  ]
}

Rules:
- Provide exactly 3 example sentences
- Keep explanations appropriate for ${point.jlptLevel} learners
- Use natural, everyday Japanese in examples
- Include furigana-style readings
`;

export const generateGrammarExplanation = async (point: IGrammarPoint): Promise<IGrammarPoint> => {
  if (point.source === 'gemini_generated' && point.explanation) {
    return point; // Already generated
  }

  logger.info(`Generating explanation for grammar: ${point.title}`);

  try {
    const generated = await generateJSON<GeneratedGrammar>(buildGrammarPrompt(point), 'fast');

    point.explanation = generated.explanation;
    point.usageNotes = generated.usageNotes;
    point.examples = generated.examples;
    point.source = 'gemini_generated';
    point.generatedAt = new Date();

    await point.save();
    logger.info(`✅ Generated and cached grammar: ${point.title}`);
    return point;
  } catch (error) {
    logger.error(`Failed to generate grammar for ${point.title}:`, error);
    throw error;
  }
};

export const ensureGrammarGenerated = async (grammarId: string): Promise<IGrammarPoint> => {
  const point = await GrammarPoint.findById(grammarId);
  if (!point) throw new Error('Grammar point not found');

  if (point.source === 'curated_skeleton' || !point.explanation) {
    return generateGrammarExplanation(point);
  }

  return point;
};
