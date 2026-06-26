import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  authProvider: 'password' | 'google';
  googleId?: string;
  isVerified: boolean;
  refreshTokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    authProvider: { type: String, enum: ['password', 'google'], default: 'password' },
    googleId: { type: String, sparse: true },
    isVerified: { type: Boolean, default: false },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { sparse: true, unique: true });

export const User = mongoose.model<IUser>('User', UserSchema);
