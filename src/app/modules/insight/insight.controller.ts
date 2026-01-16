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

// Phase 1.4: Get my insights
const getMyInsights = catchAsync(async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  
  const result = await InsightService.getMyInsights(userId, limit);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My insights fetched successfully',
    data: result,
  });
});

// Phase 1.4: Get dashboard AI summary
const getDashboardSummary = catchAsync(async (req: Request, res: Response) => {
  const { userId } = (req as any).user;
  
  const result = await InsightService.getDashboardSummary(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard summary fetched successfully',
    data: result,
  });
});

export const InsightController = {
  getRecentInsights,
  getMyInsights,
  getDashboardSummary,
};
