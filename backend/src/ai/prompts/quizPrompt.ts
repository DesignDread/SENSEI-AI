export const buildQuizPrompt = (params: {
  topic: string;
  level: string;
  count: number;
  sectionType: string;
}) => {
  return `Generate exactly ${params.count} multiple-choice JLPT ${params.level} ${params.sectionType} practice questions about "${params.topic}".

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "questions": [
    {
      "prompt": "Question text in Japanese with English if needed",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The exact correct option text",
      "explanation": "Brief explanation of why this is correct",
      "type": "multiple_choice",
      "jlptLevel": "${params.level}",
      "sectionType": "${params.sectionType}"
    }
  ]
}

Requirements:
- All questions must be at ${params.level} difficulty
- Options must be distinct and plausible
- correctAnswer must exactly match one of the options
- Explanations should be educational
- Mix of question styles appropriate for ${params.sectionType}`;
};
