import { Schema, model, Types } from 'mongoose';

/**
 * Phase 1.2: Message Interface
 * Used for client requests/messages displayed on lawyer dashboard
 */
export interface IMessage {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;      // User who sent the message (usually client)
  receiverId: Types.ObjectId;    // User who receives the message (usually lawyer)
  caseId?: Types.ObjectId;       // Optional reference to a case
  subject: string;
  content: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  readAt?: Date;
  repliedAt?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for efficient queries by receiver
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'replied', 'archived'],
      default: 'unread',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    readAt: {
      type: Date,
    },
    repliedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
messageSchema.index({ receiverId: 1, status: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', messageSchema);
