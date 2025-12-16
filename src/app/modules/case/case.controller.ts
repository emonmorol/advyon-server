import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CaseServices } from './case.service';

/**
 * Create a new case
 * POST /cases
 */
const createCase = catchAsync(async (req, res) => {
  console.log('req.user => ', req);
  const { userId } = req.user;

  const result = await CaseServices.createCase(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Case created successfully',
    data: result,
  });
});

/**
 * Get all cases with filters
 * GET /cases
 */
const getAllCases = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const result = await CaseServices.getAllCases(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cases retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

/**
 * Get a single case by ID
 * GET /cases/:caseId
 */
const getCaseById = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { caseId } = req.params;

  const result = await CaseServices.getCaseById(caseId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Case retrieved successfully',
    data: result,
  });
});

/**
 * Update a case
 * PUT /cases/:caseId
 */
const updateCase = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { caseId } = req.params;

  const result = await CaseServices.updateCase(caseId, userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Case updated successfully',
    data: result,
  });
});

/**
 * Delete a case
 * DELETE /cases/:caseId
 */
const deleteCase = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { caseId } = req.params;

  const result = await CaseServices.deleteCase(caseId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const CaseControllers = {
  createCase,
  getAllCases,
  getCaseById,
  updateCase,
  deleteCase,
};
