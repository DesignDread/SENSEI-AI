import mongoose, { Document, Schema } from 'mongoose';

export type SrsItemType = 'vocab' | 'kanji' | 'grammar';

export interface ISrsCard extends Document {
  userId: mongoose.Types.ObjectId;
  itemType: SrsItemType;
  itemId: mongoose.Types.ObjectId;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  lastReviewedAt?: Date;
  history: { reviewedAt: Date; grade: number; intervalAfter: number }[];
}

const SrsCardSchema = new Schema<ISrsCard>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['vocab', 'kanji', 'grammar'], required: true },
  itemId: { type: Schema.Types.ObjectId, required: true },
  easeFactor: { type: Number, default: 2.5 },
  intervalDays: { type: Number, default: 1 },
  repetitions: { type: Number, default: 0 },
  dueAt: { type: Date, required: true, default: Date.now },
  lastReviewedAt: { type: Date },
  history: [{
    reviewedAt: Date,
    grade: Number,
    intervalAfter: Number,
  }],
});

SrsCardSchema.index({ userId: 1, dueAt: 1 });
SrsCardSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

export const SrsCard = mongoose.model<ISrsCard>('SrsCard', SrsCardSchema);
