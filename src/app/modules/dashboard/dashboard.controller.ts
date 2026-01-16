import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DashboardServices } from './dashboard.service';

// Legacy stats endpoint (for backwards compatibility)
const getDashboardStats = catchAsync(async (req, res) => {
  const stats = await DashboardServices.getDashboardStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: stats,
  });
});

// Phase 1.5: Unified Dashboard Endpoint
const getUnifiedDashboard = catchAsync(async (req, res) => {
  const { userId } = (req as any).user;
  const result = await DashboardServices.getUnifiedDashboard(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: result,
  });
});

export const DashboardControllers = {
  getDashboardStats,
  getUnifiedDashboard,
};
