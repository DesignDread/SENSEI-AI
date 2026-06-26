import mongoose from 'mongoose';
import { UserProgress } from '../../models/UserProgress';
import { TestAttempt } from '../../models/TestAttempt';
import { SrsCard } from '../../models/SrsCard';

export const getDashboardSummary = async (userId: string) => {
  const progress = await UserProgress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  const srsStats = await SrsCard.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: 1 }, due: { $sum: { $cond: [{ $lte: ['$dueAt', new Date()] }, 1, 0] } } } },
  ]);

  return {
    streak: progress?.streak ?? { current: 0, longest: 0 },
    dailyGoal: progress?.dailyGoal ?? { type: 'reviews', target: 20, progressToday: 0 },
    xp: progress?.xp ?? 0,
    totalStudyMinutes: progress?.totalStudyMinutes ?? 0,
    srsStats: srsStats[0] ?? { total: 0, due: 0 },
  };
};

export const getMastery = async (userId: string) => {
  const progress = await UserProgress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  return progress?.masteryByLevel ?? {};
};

export const getHistory = async (userId: string, limit = 10) => {
  const attempts = await TestAttempt.find({ userId: new mongoose.Types.ObjectId(userId), status: 'graded' })
    .sort({ submittedAt: -1 })
    .limit(limit)
    .populate('testId', 'title jlptLevel')
    .lean();

  return attempts.map((a) => ({
    attemptId: a._id,
    test: a.testId,
    submittedAt: a.submittedAt,
    totalScore: a.totalScore,
    sectionScores: a.sectionScores,
  }));
};
