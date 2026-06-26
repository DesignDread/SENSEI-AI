import mongoose, { Document, Schema } from 'mongoose';

export type AgentType = 'teacher' | 'quiz' | 'evaluation' | 'planner' | 'analyst' | 'screen_assistant';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export interface IAgentSession extends Document {
  userId: mongoose.Types.ObjectId;
  agentType: AgentType;
  messages: Message[];
  contextSnapshot: {
    level: string;
    recentMistakes: string[];
    masteryVector: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AgentSessionSchema = new Schema<IAgentSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    agentType: {
      type: String,
      enum: ['teacher', 'quiz', 'evaluation', 'planner', 'analyst', 'screen_assistant'],
      required: true,
    },
    messages: [{
      role: { type: String, enum: ['user', 'agent'] },
      content: String,
      timestamp: { type: Date, default: Date.now },
    }],
    contextSnapshot: {
      level: String,
      recentMistakes: [String],
      masteryVector: { type: Map, of: Number },
    },
  },
  { timestamps: true }
);

AgentSessionSchema.index({ userId: 1, updatedAt: -1 });

export const AgentSession = mongoose.model<IAgentSession>('AgentSession', AgentSessionSchema);
