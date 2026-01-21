/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import AppError from '../../errors/appError';
import { Message, IMessage } from './message.model';
import { User } from '../user/user.model';

/**
 * Phase 1.2: Message Service
 * Handles message/client request operations
 */

// Get messages for a user (receiver) with pagination
const getMessagesForUser = async (
  userId: string,
  query: {
    status?: string;
    page?: number;
    limit?: number;
  }
) => {
  const { status, page = 1, limit = 10 } = query;
  
  // Find the user by custom id to get ObjectId
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const filter: any = { receiverId: user._id };
  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;
  
  const [messages, total] = await Promise.all([
    Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'fullName displayName email avatarUrl')
      .populate('caseId', 'title caseNumber')
      .lean(),
    Message.countDocuments(filter),
  ]);

  return {
    messages,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

// Get pending/unread messages count
const getPendingCount = async (userId: string) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const count = await Message.countDocuments({
    receiverId: user._id,
    status: 'unread',
  });

  return { count };
};

// Get a single message by ID
const getMessageById = async (messageId: string, userId: string) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const message = await Message.findOne({
    _id: new Types.ObjectId(messageId),
    $or: [{ receiverId: user._id }, { senderId: user._id }],
  })
    .populate('senderId', 'fullName displayName email avatarUrl')
    .populate('receiverId', 'fullName displayName email avatarUrl')
    .populate('caseId', 'title caseNumber');

  if (!message) {
    throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
  }

  return message;
};

// Create a new message
const createMessage = async (
  senderId: string,
  payload: {
    receiverId: string;
    caseId?: string;
    subject: string;
    content: string;
    priority?: 'low' | 'medium' | 'high';
  }
) => {
  const sender = await User.findOne({ id: senderId });
  if (!sender) {
    throw new AppError(httpStatus.NOT_FOUND, 'Sender not found');
  }

  const receiver = await User.findOne({ id: payload.receiverId });
  if (!receiver) {
    throw new AppError(httpStatus.NOT_FOUND, 'Receiver not found');
  }

  const messageData: any = {
    senderId: sender._id,
    receiverId: receiver._id,
    subject: payload.subject,
    content: payload.content,
    priority: payload.priority || 'medium',
    status: 'unread',
  };

  if (payload.caseId) {
    messageData.caseId = new Types.ObjectId(payload.caseId);
  }

  const message = await Message.create(messageData);
  return message;
};

// Mark message as read
const markAsRead = async (messageId: string, userId: string) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const message = await Message.findOneAndUpdate(
    {
      _id: new Types.ObjectId(messageId),
      receiverId: user._id,
      status: 'unread',
    },
    {
      status: 'read',
      readAt: new Date(),
    },
    { new: true }
  );

  if (!message) {
    throw new AppError(httpStatus.NOT_FOUND, 'Message not found or already read');
  }

  return message;
};

// Archive a message
const archiveMessage = async (messageId: string, userId: string) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const message = await Message.findOneAndUpdate(
    {
      _id: new Types.ObjectId(messageId),
      receiverId: user._id,
    },
    { status: 'archived' },
    { new: true }
  );

  if (!message) {
    throw new AppError(httpStatus.NOT_FOUND, 'Message not found');
  }

  return message;
};

export const MessageServices = {
  getMessagesForUser,
  getPendingCount,
  getMessageById,
  createMessage,
  markAsRead,
  archiveMessage,
};
