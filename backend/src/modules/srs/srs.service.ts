import { SrsCard, SrsItemType, ISrsCard } from '../../models/SrsCard';
import { UserProgress } from '../../models/UserProgress';
import { AppError } from '../../middleware/errorHandler';
import { Vocabulary } from '../../models/Vocabulary';
import { Kanji } from '../../models/Kanji';
import { GrammarPoint } from '../../models/GrammarPoint';
import { Profile } from '../../models/Profile';
import mongoose from 'mongoose';

// SM-2 Spaced Repetition Algorithm
const sm2 = (card: ISrsCard, grade: number) => {
  // grade: 0-5 (0-1 = fail, 2 = hard, 3 = good, 4 = easy, 5 = perfect)
  let { easeFactor, intervalDays, repetitions } = card;

  if (grade >= 3) {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions++;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return { easeFactor, intervalDays, repetitions, dueAt };
};

export const getDueCards = async (userId: string, limit = 20) => {
  return SrsCard.find({
    userId: new mongoose.Types.ObjectId(userId),
    dueAt: { $lte: new Date() },
  })
    .limit(limit)
    .populate('itemId')
    .lean();
};

export const submitReview = async (userId: string, cardId: string, grade: number) => {
  if (grade < 0 || grade > 5) throw new AppError('Grade must be between 0 and 5', 400);

  const card = await SrsCard.findOne({
    _id: new mongoose.Types.ObjectId(cardId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!card) throw new AppError('SRS card not found', 404);

  const updated = sm2(card, grade);
  card.easeFactor = updated.easeFactor;
  card.intervalDays = updated.intervalDays;
  card.repetitions = updated.repetitions;
  card.dueAt = updated.dueAt;
  card.lastReviewedAt = new Date();
  card.history.push({
    reviewedAt: new Date(),
    grade,
    intervalAfter: updated.intervalDays,
  });

  await card.save();

  // Update daily progress
  await UserProgress.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    {
      $inc: { 'dailyGoal.progressToday': 1, totalStudyMinutes: 0.5, xp: grade >= 3 ? 5 : 1 },
      $set: { 'streak.lastStudyDate': new Date() },
    },
    { upsert: true }
  );

  return { card, nextInterval: updated.intervalDays, nextDue: updated.dueAt };
};

export const addCardToSRS = async (
  userId: string,
  itemType: SrsItemType,
  itemId: string
) => {
  const existing = await SrsCard.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    itemType,
    itemId: new mongoose.Types.ObjectId(itemId),
  });
  if (existing) return existing;

  return SrsCard.create({
    userId: new mongoose.Types.ObjectId(userId),
    itemType,
    itemId: new mongoose.Types.ObjectId(itemId),
    dueAt: new Date(),
  });
};

export const getSrsStats = async (userId: string) => {
  const total = await SrsCard.countDocuments({ userId });
  const due = await SrsCard.countDocuments({ userId, dueAt: { $lte: new Date() } });
  const learned = await SrsCard.countDocuments({ userId, repetitions: { $gte: 1 } });
  return { total, due, learned };
};

/**
 * Auto-seed SRS cards for a user from the content DB.
 * Fetches vocab + kanji + grammar for the user's JLPT level
 * and bulk-inserts SRS cards (skipping any that already exist).
 */
export const seedCardsForUser = async (userId: string, limit = 30) => {
  const userObjId = new mongoose.Types.ObjectId(userId);

  // Get user's current level from profile
  const profile = await Profile.findOne({ userId: userObjId }).lean();
  const level = (profile as any)?.currentLevels?.kanji || 'N5';

  // Fetch items from DB
  const [vocabItems, kanjiItems, grammarItems] = await Promise.all([
    Vocabulary.find({ jlptLevel: level }).limit(limit).select('_id').lean(),
    Kanji.find({ jlptLevel: level }).limit(limit).select('_id').lean(),
    GrammarPoint.find({ jlptLevel: level }).limit(limit).select('_id').lean(),
  ]);

  // Get already-existing card itemIds to avoid duplication checks
  const existingCards = await SrsCard.find({ userId: userObjId })
    .select('itemId itemType')
    .lean();

  const existingSet = new Set(
    existingCards.map((c: any) => `${c.itemType}:${c.itemId.toString()}`)
  );

  const now = new Date();
  const toInsert: any[] = [];

  for (const v of vocabItems) {
    const key = `vocab:${(v as any)._id.toString()}`;
    if (!existingSet.has(key)) {
      toInsert.push({ userId: userObjId, itemType: 'vocab', itemId: (v as any)._id, dueAt: now });
    }
  }
  for (const k of kanjiItems) {
    const key = `kanji:${(k as any)._id.toString()}`;
    if (!existingSet.has(key)) {
      toInsert.push({ userId: userObjId, itemType: 'kanji', itemId: (k as any)._id, dueAt: now });
    }
  }
  for (const g of grammarItems) {
    const key = `grammar:${(g as any)._id.toString()}`;
    if (!existingSet.has(key)) {
      toInsert.push({ userId: userObjId, itemType: 'grammar', itemId: (g as any)._id, dueAt: now });
    }
  }

  if (toInsert.length === 0) return { added: 0, level };

  // insertMany with ordered:false skips duplicates gracefully
  await SrsCard.insertMany(toInsert, { ordered: false }).catch(() => {});

  return { added: toInsert.length, level };
};
