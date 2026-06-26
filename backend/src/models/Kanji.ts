import mongoose, { Document, Schema } from 'mongoose';
import { JLPTLevel } from './Profile';

export interface IKanji extends Document {
  character: string;
  jlptLevel: JLPTLevel;
  strokeCount: number;
  meanings: string[];
  onyomi: string[];
  kunyomi: string[];
  radicals: { character: string; meaning: string }[];
  exampleWords: { word: string; reading: string; meaning: string }[];
  mnemonicText?: string;
  strokeOrderSvgUrl?: string;
  pictographImage?: {
    url: string;
    promptVersion: string;
    generatedAt: Date;
    model: string;
    moderationStatus: string;
  };
  frequencyRank?: number;
}

const KanjiSchema = new Schema<IKanji>({
  character: { type: String, required: true, unique: true },
  jlptLevel: { type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'], required: true },
  strokeCount: { type: Number, required: true },
  meanings: [{ type: String }],
  onyomi: [{ type: String }],
  kunyomi: [{ type: String }],
  radicals: [{ character: String, meaning: String }],
  exampleWords: [{ word: String, reading: String, meaning: String }],
  mnemonicText: { type: String },
  strokeOrderSvgUrl: { type: String },
  pictographImage: {
    url: String,
    promptVersion: String,
    generatedAt: Date,
    model: String,
    moderationStatus: { type: String, default: 'pending' },
  },
  frequencyRank: { type: Number },
});

KanjiSchema.index({ jlptLevel: 1, frequencyRank: 1 });

export const Kanji = mongoose.model<IKanji>('Kanji', KanjiSchema);
