/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/appError';
import { User } from '../user/user.model';
import { TCreateCasePayload, TCaseQuery, TUpdateCasePayload } from './case.interface';
import { Case } from './case.model';
import { generateCaseId } from './case.utils';
import { DEFAULT_CASE_FOLDERS } from './case.constant';
import { ActivityService } from '../activity/activity.service';
import { CaseAccessModel } from '../caseAccess/caseAccess.model';

/**
 * Create a new case
 */
const createCase = async (userId: string, payload: TCreateCasePayload) => {
  // Verify user exists
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Generate unique case ID
  const caseId = await generateCaseId();

  // Use default folders if not provided
  const folders = payload.folders || DEFAULT_CASE_FOLDERS;

  // Create case
  const newCase = await Case.create({
    id: caseId,
    caseNumber: payload.caseNumber,
    title: payload.title,
    caseType: payload.caseType,
    urgency: payload.urgency,
    nextDeadline: payload.nextDeadline,
    nextDeadlineDescription: payload.nextDeadlineDescription,
    folders,
    createdBy: user._id,
    progress: 0,
    status: 'active',
  });

  // Log activity
  await ActivityService.logActivity({
    type: 'case_created',
    message: `New case created: ${newCase.title} (${newCase.caseNumber})`,
    userId: user._id,
    caseId: newCase._id,
  });

  return await Case.findById(newCase._id).populate('createdBy', 'id fullName email');
};

/**
 * Get all cases for a user with filtering and pagination
 */
const getAllCases = async (userId: string, query: TCaseQuery) => {
  // Verify user exists
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { search, status, urgency, page = 1, limit = 10 } = query;

  // Build filter
  // Find cases where user is owner OR has shared access
  const sharedCaseAccess = await CaseAccessModel.find({ 
    userId: user._id, 
    status: 'active' 
  }).select('caseId');
  
  const sharedCaseIds = sharedCaseAccess.map(access => access.caseId);
  
  const filter: any = {
    $or: [
      { createdBy: user._id },
      { _id: { $in: sharedCaseIds } }
    ],
    isDeleted: { $ne: true }
  };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { caseNumber: { $regex: search, $options: 'i' } },
    ];
  }

  if (status) {
    filter.status = status;
  }

  if (urgency) {
    filter.urgency = urgency;
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  const cases = await Case.find(filter)
    .populate('createdBy', 'id fullName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Case.countDocuments(filter);

  return {
    data: cases,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Get a single case by ID
 */
const getCaseById = async (caseId: string, userId: string) => {
  // Verify user exists
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const caseData = await Case.findOne({ id: caseId }).populate(
    'createdBy',
    'id fullName email',
  );

  if (!caseData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Case not found');
  }

  // Verify user owns the case
  if (caseData.createdBy._id.toString() !== user._id.toString()) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to access this case');
  }

  return caseData;
};

/**
 * Update a case
 */
const updateCase = async (
  caseId: string,
  userId: string,
  payload: TUpdateCasePayload,
) => {
  // Verify user exists
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const caseData = await Case.findOne({ id: caseId });

  if (!caseData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Case not found');
  }

  // Verify user owns the case
  if (caseData.createdBy.toString() !== user._id.toString()) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to update this case');
  }

  // Update case
  const updatedCase = await Case.findOneAndUpdate(
    { id: caseId },
    { $set: payload },
    { new: true, runValidators: true },
  ).populate('createdBy', 'id fullName email');

  // Log activity
  if (updatedCase) {
    await ActivityService.logActivity({
      type: 'case_updated',
      message: `Case updated: ${updatedCase.title}`,
      userId: user._id,
      caseId: updatedCase._id,
    });
  }

  return updatedCase;
};

/**
 * Delete a case (soft delete)
 */
const deleteCase = async (caseId: string, userId: string) => {
  // Verify user exists
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const caseData = await Case.findOne({ id: caseId });

  if (!caseData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Case not found');
  }

  // Verify user owns the case
  if (caseData.createdBy.toString() !== user._id.toString()) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to delete this case');
  }

  // Soft delete
  await Case.findOneAndUpdate(
    { id: caseId },
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  return { message: 'Case deleted successfully' };
};

export const CaseServices = {
  createCase,
  getAllCases,
  getCaseById,
  updateCase,
  deleteCase,
};
