import mongoose, { Document, Schema } from 'mongoose';
import { JLPTLevel } from './Profile';
import { SectionType } from './Question';

interface TestSection {
  type: SectionType;
  durationMinutes: number;
  questions: mongoose.Types.ObjectId[];
}

export interface ITestTemplate extends Document {
  title: string;
  jlptLevel: JLPTLevel;
  sections: TestSection[];
  totalDurationMinutes: number;
  description?: string;
}

const TestTemplateSchema = new Schema<ITestTemplate>({
  title: { type: String, required: true },
  jlptLevel: { type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'], required: true },
  sections: [{
    type: { type: String, enum: ['vocab', 'grammar', 'reading', 'listening'] },
    durationMinutes: Number,
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  }],
  totalDurationMinutes: { type: Number, required: true },
  description: { type: String },
});

export const TestTemplate = mongoose.model<ITestTemplate>('TestTemplate', TestTemplateSchema);
