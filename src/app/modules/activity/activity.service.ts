import { ActivityModel } from './activity.model';
import { TActivity } from './activity.interface';

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

export const ActivityService = {
  logActivity,
  getAllActivitiesFromDB,
  getCaseActivitiesFromDB,
};
