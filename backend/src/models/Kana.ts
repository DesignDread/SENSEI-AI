import mongoose, { Document, Schema } from 'mongoose';

export interface IKana extends Document {
  character: string;
  script: 'hiragana' | 'katakana';
  romaji: string;
  strokeOrderSvgUrl?: string;
  audioUrl?: string;
  mnemonicText?: string;
}

const KanaSchema = new Schema<IKana>({
  character: { type: String, required: true },
  script: { type: String, enum: ['hiragana', 'katakana'], required: true },
  romaji: { type: String, required: true },
  strokeOrderSvgUrl: { type: String },
  audioUrl: { type: String },
  mnemonicText: { type: String },
});

KanaSchema.index({ script: 1, character: 1 }, { unique: true });

export const Kana = mongoose.model<IKana>('Kana', KanaSchema);
