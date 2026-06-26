import mongoose, { Document, Schema } from 'mongoose';
import { JLPTLevel } from './Profile';

export type SectionType = 'vocab' | 'grammar' | 'reading' | 'listening';

export interface IQuestion extends Document {
  type: string;
  jlptLevel: JLPTLevel;
  sectionType: SectionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  tags?: string[];
}

const QuestionSchema = new Schema<IQuestion>({
  type: { type: String, required: true },
  jlptLevel: { type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'], required: true },
  sectionType: { type: String, enum: ['vocab', 'grammar', 'reading', 'listening'], required: true },
  prompt: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  tags: [{ type: String }],
});

QuestionSchema.index({ jlptLevel: 1, sectionType: 1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
