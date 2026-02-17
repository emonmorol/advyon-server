/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/appError';
import { User } from '../user/user.model';
import { NotificationModel } from './notification.model';
import { TNotification } from './notification.interface';
import { Types } from 'mongoose';

/**
 * WBS-9.1: Notification Service
 * Handles multi-channel notification dispatch.
 */

// Mock email sender (replace with actual email service later)
const sendEmail = async (to: string, subject: string, body: string) => {
  console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}, Body: ${body}`);
  return true;
};

// Mock web push sender (replace with actual push service later)
const sendWebPush = async (userId: string, title: string, body: string) => {
  console.log(`[WEBPUSH MOCK] User: ${userId}, Title: ${title}, Body: ${body}`);
  return true;
};

const sendNotification = async (payload: Partial<TNotification>) => {
  // Validate recipient
  const recipient = await User.findById(payload.recipientId);
  if (!recipient) {
    throw new AppError(httpStatus.NOT_FOUND, 'Recipient user not found');
  }

  // Idempotency check
  if (payload.idempotencyKey) {
    const existing = await NotificationModel.findOne({ idempotencyKey: payload.idempotencyKey });
    if (existing) {
      return existing; // Return existing notification without re-sending
    }
  }

  // Save in-app notification
  const notification = await NotificationModel.create({
    ...payload,
    isRead: false,
  });

  // Multi-channel dispatch
  if (payload.channels?.email && recipient.email) {
    await sendEmail(recipient.email, payload.title || 'New Notification', payload.message || '');
  }

  if (payload.channels?.webPush) {
    await sendWebPush(recipient.id, payload.title || 'New Notification', payload.message || '');
  }

  // Real-time socket event (handled by socket service listening to DB stream or direct call)
  // For now, assume socket service handles it separately or we call it here if circular dependencies allow.
  // const socketService = require('../socket/socket.service'); 
  // socketService.emitToUser(recipient.id, 'notification', notification);

  return notification;
};

const getUserNotifications = async (userId: string, query: any) => {
  const { page = 1, limit = 10, isRead } = query;
  const filter: any = { recipientId: userId };

  if (isRead !== undefined) {
    filter.isRead = isRead === 'true';
  }

  const skip = (Number(page) - 1) * Number(limit);

  const notifications = await NotificationModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await NotificationModel.countDocuments(filter);
  const unreadCount = await NotificationModel.countDocuments({ recipientId: userId, isRead: false });

  return {
    data: notifications,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
      unreadCount,
    },
  };
};

const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await NotificationModel.findOne({
    _id: notificationId,
    recipientId: userId
  });

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};

const markAllAsRead = async (userId: string) => {
  await NotificationModel.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true } }
  );
  return { message: 'All notifications marked as read' };
};

const deleteNotification = async (notificationId: string, userId: string) => {
  const result = await NotificationModel.findOneAndDelete({
    _id: notificationId,
    recipientId: userId,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  return result;
};

export const NotificationServices = {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
