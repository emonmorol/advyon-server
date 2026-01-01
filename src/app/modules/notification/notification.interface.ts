import { Types } from 'mongoose';

export type TNotificationType = 'alert' | 'request' | 'message';
export type TNotificationPriority = 'low' | 'medium' | 'high';

export interface TNotification {
  type: TNotificationType;
  priority: TNotificationPriority;
  title: string;
  message: string;
  recipientId: Types.ObjectId;
  senderId?: Types.ObjectId;
  caseId?: Types.ObjectId;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
