import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ActivityService } from './activity.service';

const getAllActivities = catchAsync(async (req: Request, res: Response) => {
  const result = await ActivityService.getAllActivitiesFromDB({});
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Activities fetched successfully',
    data: result,
  });
});

const getCaseActivities = catchAsync(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const result = await ActivityService.getCaseActivitiesFromDB(caseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Case activities fetched successfully',
    data: result,
  });
});

// Phase 1.3: Get my recent activities
const getMyRecentActivities = catchAsync(async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  
  const result = await ActivityService.getRecentByUser(userId, limit);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recent activities fetched successfully',
    data: result,
  });
});

// Phase 1.3: Get my activity stats
const getMyStats = catchAsync(async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  
  const result = await ActivityService.getStats(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Activity stats fetched successfully',
    data: result,
  });
});

export const ActivityController = {
  getAllActivities,
  getCaseActivities,
  getMyRecentActivities,
  getMyStats,
};
