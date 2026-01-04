import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AIServices } from './ai.service';

const chat = catchAsync(async (req, res) => {
  const result = await AIServices.processChat(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'AI response generated successfully',
    data: result,
  });
});

const analyzeDocument = catchAsync(async (req, res) => {
  const { documentId } = req.body;

  if (!documentId) {
    throw new Error('Document ID is required');
  }

  const result = await AIServices.analyzeDocument(documentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Document analysis generated successfully',
    data: result,
  });
});

export const AIControllers = {
  chat,
  analyzeDocument,
};
