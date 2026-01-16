import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { MessageServices } from './message.service';

/**
 * Phase 1.2: Message Controller
 * Handles HTTP requests for messages/client requests
 */

// Get messages for logged-in user
const getMyMessages = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { status, page, limit } = req.query;
  
  const result = await MessageServices.getMessagesForUser(userId, {
    status: status as string,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 10,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Messages retrieved successfully',
    data: result.messages,
    meta: result.meta,
  });
});

// Get pending messages count
const getPendingCount = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await MessageServices.getPendingCount(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Pending count retrieved successfully',
    data: result,
  });
});

// Get single message
const getMessage = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  
  const result = await MessageServices.getMessageById(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message retrieved successfully',
    data: result,
  });
});

// Create a new message
const createMessage = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await MessageServices.createMessage(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

// Mark message as read
const markAsRead = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  
  const result = await MessageServices.markAsRead(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message marked as read',
    data: result,
  });
});

// Archive message
const archiveMessage = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  
  const result = await MessageServices.archiveMessage(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message archived successfully',
    data: result,
  });
});

export const MessageControllers = {
  getMyMessages,
  getPendingCount,
  getMessage,
  createMessage,
  markAsRead,
  archiveMessage,
};
