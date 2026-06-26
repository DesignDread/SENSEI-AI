import mongoose, { Document, Schema } from 'mongoose';
import { JLPTLevel } from './Profile';

export interface IVocabulary extends Document {
  word: string;
  reading: string;
  meanings: string[];
  partOfSpeech: string;
  jlptLevel: JLPTLevel;
  category?: string;
  exampleSentences: { jp: string; reading: string; en: string }[];
  audioUrl?: string;
  tags: string[];
}

const VocabularySchema = new Schema<IVocabulary>({
  word: { type: String, required: true },
  reading: { type: String, required: true },
  meanings: [{ type: String }],
  partOfSpeech: { type: String, required: true },
  jlptLevel: { type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'], required: true },
  category: { type: String },
  exampleSentences: [{ jp: String, reading: String, en: String }],
  audioUrl: { type: String },
  tags: [{ type: String }],
});

VocabularySchema.index({ jlptLevel: 1, category: 1 });
VocabularySchema.index({ word: 'text', reading: 'text', meanings: 'text' });

export const Vocabulary = mongoose.model<IVocabulary>('Vocabulary', VocabularySchema);
