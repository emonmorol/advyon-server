import { ActivityModel } from './activity.model';
import { TActivity } from './activity.interface';
import { User } from '../user/user.model';
import httpStatus from 'http-status';
import AppError from '../../errors/appError';

const logActivity = async (payload: Partial<TActivity>) => {
  const result = await ActivityModel.create(payload);
  return result;
};

const getAllActivitiesFromDB = async (query: Record<string, unknown>) => {
  const activities = await ActivityModel.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('userId', 'fullName email')
    .populate('caseId', 'title caseNumber');
  return activities;
};

const getCaseActivitiesFromDB = async (caseId: string) => {
  const activities = await ActivityModel.find({ caseId })
    .sort({ createdAt: -1 })
    .populate('userId', 'fullName email');
  return activities;
};

// Phase 1.3: Get recent activities for a user
const getRecentByUser = async (userId: string, limit: number = 10) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const activities = await ActivityModel.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('caseId', 'title caseNumber');
  
  return activities;
};

// Phase 1.3: Get activity stats for dashboard
const getStats = async (userId: string) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [todayCount, weekCount, totalCount] = await Promise.all([
    ActivityModel.countDocuments({ 
      userId: user._id, 
      createdAt: { $gte: today } 
    }),
    ActivityModel.countDocuments({ 
      userId: user._id, 
      createdAt: { $gte: weekAgo } 
    }),
    ActivityModel.countDocuments({ userId: user._id }),
  ]);

  return {
    todayActivities: todayCount,
    weekActivities: weekCount,
    totalActivities: totalCount,
  };
};

export const ActivityService = {
  logActivity,
  getAllActivitiesFromDB,
  getCaseActivitiesFromDB,
  getRecentByUser,
  getStats,
};
