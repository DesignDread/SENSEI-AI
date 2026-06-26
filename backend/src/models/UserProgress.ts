import mongoose, { Document, Schema } from 'mongoose';
import { JLPTLevel } from './Profile';

interface MasteryByLevel {
  vocab: number;
  grammar: number;
  kanji: number;
}

export interface IUserProgress extends Document {
  userId: mongoose.Types.ObjectId;
  streak: { current: number; longest: number; lastStudyDate?: Date };
  dailyGoal: { type: 'minutes' | 'reviews' | 'lessons'; target: number; progressToday: number };
  masteryByLevel: Record<JLPTLevel, MasteryByLevel>;
  totalStudyMinutes: number;
  xp: number;
  updatedAt: Date;
}

const defaultMastery = (): MasteryByLevel => ({ vocab: 0, grammar: 0, kanji: 0 });

const UserProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastStudyDate: { type: Date },
    },
    dailyGoal: {
      type: { type: String, enum: ['minutes', 'reviews', 'lessons'], default: 'reviews' },
      target: { type: Number, default: 20 },
      progressToday: { type: Number, default: 0 },
    },
    masteryByLevel: {
      N5: { vocab: { type: Number, default: 0 }, grammar: { type: Number, default: 0 }, kanji: { type: Number, default: 0 } },
      N4: { vocab: { type: Number, default: 0 }, grammar: { type: Number, default: 0 }, kanji: { type: Number, default: 0 } },
      N3: { vocab: { type: Number, default: 0 }, grammar: { type: Number, default: 0 }, kanji: { type: Number, default: 0 } },
      N2: { vocab: { type: Number, default: 0 }, grammar: { type: Number, default: 0 }, kanji: { type: Number, default: 0 } },
      N1: { vocab: { type: Number, default: 0 }, grammar: { type: Number, default: 0 }, kanji: { type: Number, default: 0 } },
    },
    totalStudyMinutes: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserProgressSchema.index({ userId: 1 }, { unique: true });

export const UserProgress = mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);
