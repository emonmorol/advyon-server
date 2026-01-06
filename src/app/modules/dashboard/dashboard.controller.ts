import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

const getDashboardStats = catchAsync(async (req, res) => {
    // TODO: Replace with real aggregation queries
    const stats = {
        activeCases: 2,
        upcomingHearings: 1,
        pendingReview: 0,
        clientMessages: 8,
        urgentTasks: 0
    };

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: stats,
  });
});

export const DashboardControllers = {
  getDashboardStats,
};
