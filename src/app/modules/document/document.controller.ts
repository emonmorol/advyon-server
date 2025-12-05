import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DocumentServices } from './document.service';

/**
 * Upload a document
 * POST /cases/:caseId/documents/upload
 */
const uploadDocument = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { caseId } = req.params;
  const { folderName } = req.body;
  const file = req.file;

  if (!file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'No file uploaded',
      data: null,
    });
  }

  const result = await DocumentServices.uploadDocument(
    caseId,
    userId,
    file,
    folderName,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Document uploaded successfully',
    data: result,
  });
});

/**
 * Get all documents for a case
 * GET /cases/:caseId/documents
 */
const getDocuments = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { caseId } = req.params;

  const result = await DocumentServices.getDocumentsByCase(caseId, userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Documents retrieved successfully',
    data: result,
  });
});

/**
 * Delete a document
 * DELETE /cases/:caseId/documents/:documentId
 */
const deleteDocument = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { caseId, documentId } = req.params;

  const result = await DocumentServices.deleteDocument(documentId, caseId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const DocumentControllers = {
  uploadDocument,
  getDocuments,
  deleteDocument,
};
