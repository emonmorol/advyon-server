import { Schema, model } from 'mongoose';
import { TCaseAccess } from './caseAccess.interface';

const caseAccessSchema = new Schema<TCaseAccess>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer',
    },
    expiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'pending'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
caseAccessSchema.index({ caseId: 1, userId: 1 }, { unique: true });
caseAccessSchema.index({ userId: 1 });

export const CaseAccessModel = model<TCaseAccess>('CaseAccess', caseAccessSchema);
