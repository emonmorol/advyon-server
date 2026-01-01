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

export const ActivityController = {
  getAllActivities,
  getCaseActivities,
};
