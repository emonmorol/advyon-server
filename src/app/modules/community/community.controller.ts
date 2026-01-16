import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CommunityService } from './community.service';

const createThread = catchAsync(async (req, res) => {
  const result = await CommunityService.createThread({ ...req.body, author: req.user.userId });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Thread created successfully',
    data: result,
  });
});

const getAllThreads = catchAsync(async (req, res) => {
  const result = await CommunityService.getAllThreads(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Threads retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const getThreadById = catchAsync(async (req, res) => {
  const result = await CommunityService.getThreadById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Thread retrieved successfully',
    data: result,
  });
});

const addReply = catchAsync(async (req, res) => {
  const result = await CommunityService.addReply({ ...req.body, threadId: req.params.threadId, author: req.user.userId });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Reply added successfully',
    data: result,
  });
});

const voteThread = catchAsync(async (req, res) => {
  const result = await CommunityService.voteThread(req.params.id, req.user.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vote updated',
    data: result
  })
})

export const CommunityController = {
  createThread,
  getAllThreads,
  getThreadById,
  addReply,
  voteThread
};
