import mongoose from 'mongoose';
import { TestTemplate } from '../../models/TestTemplate';
import { TestAttempt } from '../../models/TestAttempt';
import { Question } from '../../models/Question';
import { UserProgress } from '../../models/UserProgress';
import { AppError } from '../../middleware/errorHandler';

export const listTests = async (level?: string) => {
  const filter = level ? { jlptLevel: level } : {};
  return TestTemplate.find(filter).select('title jlptLevel totalDurationMinutes description').lean();
};

export const startAttempt = async (userId: string, testId: string) => {
  const test = await TestTemplate.findById(testId).populate({
    path: 'sections.questions',
    model: 'Question',
  });
  if (!test) throw new AppError('Test not found', 404);

  const attempt = await TestAttempt.create({
    userId: new mongoose.Types.ObjectId(userId),
    testId: test._id,
    status: 'in_progress',
  });

  return { attempt, test };
};

export const submitAttempt = async (
  userId: string,
  attemptId: string,
  answers: { questionId: string; selected: string; timeSpentSec: number }[]
) => {
  const attempt = await TestAttempt.findOne({
    _id: new mongoose.Types.ObjectId(attemptId),
    userId: new mongoose.Types.ObjectId(userId),
    status: 'in_progress',
  });
  if (!attempt) throw new AppError('Attempt not found or already submitted', 404);

  const test = await TestTemplate.findById(attempt.testId);
  if (!test) throw new AppError('Test not found', 404);

  // Grade answers
  const sectionCorrect: Record<string, { correct: number; total: number }> = {};
  const gradedAnswers = [];

  for (const ans of answers) {
    const question = await Question.findById(ans.questionId).lean();
    if (!question) continue;
    const correct = question.correctAnswer === ans.selected;
    const section = question.sectionType;
    if (!sectionCorrect[section]) sectionCorrect[section] = { correct: 0, total: 0 };
    sectionCorrect[section].correct += correct ? 1 : 0;
    sectionCorrect[section].total += 1;
    gradedAnswers.push({ questionId: question._id, selected: ans.selected, correct, timeSpentSec: ans.timeSpentSec });
  }

  // Calculate scores (0-100)
  const sectionScores: Record<string, number> = {};
  let totalCorrect = 0;
  let totalQuestions = 0;
  for (const [section, counts] of Object.entries(sectionCorrect)) {
    sectionScores[section] = counts.total > 0 ? Math.round((counts.correct / counts.total) * 100) : 0;
    totalCorrect += counts.correct;
    totalQuestions += counts.total;
  }
  const totalScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Generate weakness tags
  const weaknessTags = Object.entries(sectionScores)
    .filter(([, score]) => score < 60)
    .map(([section]) => section);

  attempt.answers = gradedAnswers as typeof attempt.answers;
  attempt.sectionScores = sectionScores as typeof attempt.sectionScores;
  attempt.totalScore = totalScore;
  attempt.weaknessTags = weaknessTags;
  attempt.submittedAt = new Date();
  attempt.status = 'graded';
  await attempt.save();

  // Update XP
  await UserProgress.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $inc: { xp: Math.round(totalScore / 10), totalStudyMinutes: test.totalDurationMinutes } },
    { upsert: true }
  );

  return attempt;
};

export const getReport = async (userId: string, attemptId: string) => {
  const attempt = await TestAttempt.findOne({
    _id: new mongoose.Types.ObjectId(attemptId),
    userId: new mongoose.Types.ObjectId(userId),
  }).populate('testId', 'title jlptLevel').lean();
  if (!attempt) throw new AppError('Report not found', 404);
  return attempt;
};
