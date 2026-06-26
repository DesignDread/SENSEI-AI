import mongoose, { Document, Schema } from 'mongoose';
import { JLPTLevel } from './Profile';

export interface IGrammarPoint extends Document {
  title: string;
  jlptLevel: JLPTLevel;
  category: 'particle' | 'verb_form' | 'adjective_form' | 'sentence_pattern';
  structurePattern: string;
  explanation?: string;
  usageNotes?: string;
  examples?: { jp: string; reading: string; en: string }[];
  source: 'curated_skeleton' | 'gemini_generated';
  generatedAt?: Date;
}

const GrammarPointSchema = new Schema<IGrammarPoint>({
  title: { type: String, required: true },
  jlptLevel: { type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'], required: true },
  category: {
    type: String,
    enum: ['particle', 'verb_form', 'adjective_form', 'sentence_pattern'],
    default: 'sentence_pattern',
  },
  structurePattern: { type: String, required: true },
  explanation: { type: String },
  usageNotes: { type: String },
  examples: [{ jp: String, reading: String, en: String }],
  source: {
    type: String,
    enum: ['curated_skeleton', 'gemini_generated'],
    default: 'curated_skeleton',
  },
  generatedAt: { type: Date },
});

GrammarPointSchema.index({ jlptLevel: 1, category: 1 });
GrammarPointSchema.index({ title: 1, jlptLevel: 1 }, { unique: true });

export const GrammarPoint = mongoose.model<IGrammarPoint>('GrammarPoint', GrammarPointSchema);
