import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { NotificationService } from './notification.service';
import { User } from '../user/user.model';
import AppError from '../../errors/appError';
import httpStatus from 'http-status';

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findOne({ id: req.user.id });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  const result = await NotificationService.getMyNotificationsFromDB(user._id.toString());
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notifications fetched successfully',
    data: result,
  });
});

const getNotificationSummary = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findOne({ id: req.user.id });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  const result = await NotificationService.getNotificationSummaryFromDB(user._id.toString());
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification summary fetched successfully',
    data: result,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NotificationService.markAsReadInDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notification marked as read',
    data: result,
  });
});

export const NotificationController = {
  getMyNotifications,
  getNotificationSummary,
  markAsRead,
};
