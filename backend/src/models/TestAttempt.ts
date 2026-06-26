import mongoose, { Document, Schema } from 'mongoose';

interface AnswerRecord {
  questionId: mongoose.Types.ObjectId;
  selected: string;
  correct: boolean;
  timeSpentSec: number;
}

export interface SectionScores {
  vocab?: number;
  grammar?: number;
  reading?: number;
  listening?: number;
}

export interface ITestAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  answers: AnswerRecord[];
  sectionScores: SectionScores;
  totalScore: number;
  weaknessTags: string[];
  status: 'in_progress' | 'submitted' | 'graded';
}

const TestAttemptSchema = new Schema<ITestAttempt>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'TestTemplate', required: true },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  answers: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
    selected: String,
    correct: Boolean,
    timeSpentSec: Number,
  }],
  sectionScores: {
    vocab: Number, grammar: Number, reading: Number, listening: Number,
  },
  totalScore: { type: Number, default: 0 },
  weaknessTags: [{ type: String }],
  status: { type: String, enum: ['in_progress', 'submitted', 'graded'], default: 'in_progress' },
});

TestAttemptSchema.index({ userId: 1, submittedAt: -1 });
TestAttemptSchema.index({ testId: 1 });

export const TestAttempt = mongoose.model<ITestAttempt>('TestAttempt', TestAttemptSchema);
