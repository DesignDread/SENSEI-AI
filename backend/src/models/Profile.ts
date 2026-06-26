import mongoose, { Document, Schema } from 'mongoose';

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type KanaLevel = 'hiragana' | 'katakana' | 'both_complete';

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  displayName: string;
  currentLevels: {
    kana: KanaLevel;
    kanji: JLPTLevel;
    vocabulary: JLPTLevel;
    grammar: JLPTLevel;
  };
  dailyGoalMinutes: number;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName: { type: String, required: true, trim: true },
    currentLevels: {
      kana: { type: String, enum: ['hiragana', 'katakana', 'both_complete'], default: 'hiragana' },
      kanji: { type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'], default: 'N5' },
      vocabulary: { type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'], default: 'N5' },
      grammar: { type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1'], default: 'N5' },
    },
    dailyGoalMinutes: { type: Number, default: 15 },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { timestamps: true }
);

ProfileSchema.index({ userId: 1 }, { unique: true });

export const Profile = mongoose.model<IProfile>('Profile', ProfileSchema);
