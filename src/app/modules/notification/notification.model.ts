import { Schema, model } from 'mongoose';
import { TNotification } from './notification.interface';

const notificationSchema = new Schema<TNotification>(
  {
    type: {
      type: String,
      required: true,
      enum: ['alert', 'request', 'message'],
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const NotificationModel = model<TNotification>('Notification', notificationSchema);
