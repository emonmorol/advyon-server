import { Model, Types } from 'mongoose';

export type TMessageStatus = 'unread' | 'read' | 'replied' | 'archived';
export type TMessagePriority = 'low' | 'medium' | 'high';

export interface IMessage {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  caseId?: Types.ObjectId;
  subject: string;
  content: string;
  status: TMessageStatus;
  priority: TMessagePriority;
  attachments?: string[];
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageModel = Model<IMessage>;
