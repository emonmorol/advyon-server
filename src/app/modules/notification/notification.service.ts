import { NotificationModel } from './notification.model';
import { TNotification } from './notification.interface';

const createNotification = async (payload: Partial<TNotification>) => {
  const result = await NotificationModel.create(payload);
  return result;
};

const getMyNotificationsFromDB = async (userId: string) => {
  const result = await NotificationModel.find({ recipientId: userId })
    .sort({ createdAt: -1 })
    .limit(50);
  return result;
};

const markAsReadInDB = async (notificationId: string) => {
  const result = await NotificationModel.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true },
  );
  return result;
};

const getNotificationSummaryFromDB = async (userId: string) => {
  const unreadCount = await NotificationModel.countDocuments({
    recipientId: userId,
    isRead: false,
  });
  const alertsCount = await NotificationModel.countDocuments({
    recipientId: userId,
    type: 'alert',
    isRead: false,
  });
  const requestsCount = await NotificationModel.countDocuments({
    recipientId: userId,
    type: 'request',
    isRead: false,
  });

  return { unreadCount, alertsCount, requestsCount };
};

export const NotificationService = {
  createNotification,
  getMyNotificationsFromDB,
  markAsReadInDB,
  getNotificationSummaryFromDB,
};
