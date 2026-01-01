import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { InsightService } from './insight.service';

const getRecentInsights = catchAsync(async (req: Request, res: Response) => {
  const result = await InsightService.getRecentInsightsFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recent insights fetched successfully',
    data: result,
  });
});

export const InsightController = {
  getRecentInsights,
};
