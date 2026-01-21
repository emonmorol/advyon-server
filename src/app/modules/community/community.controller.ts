import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CommunityServices } from './community.service';

const getThreads = catchAsync(async (req, res) => {
  const result = await CommunityServices.getThreads();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Community threads retrieved successfully',
    data: result,
  });
});

export const CommunityControllers = {
  getThreads,
};
