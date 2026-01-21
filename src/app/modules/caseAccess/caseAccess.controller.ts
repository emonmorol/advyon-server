import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CaseAccessService } from './caseAccess.service';
import { User } from '../user/user.model';
import AppError from '../../errors/appError';
import httpStatus from 'http-status';

const shareCase = catchAsync(async (req: Request, res: Response) => {
  const granter = await User.findOne({ id: req.user.id });
  if (!granter) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  
  const result = await CaseAccessService.shareCaseWithUser(
    req.body.userId, 
    req.body, 
    granter._id.toString()
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Case shared successfully',
    data: result,
  });
});

const getCaseSharedUsers = catchAsync(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const result = await CaseAccessService.getSharedUsersForCase(caseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Shared users fetched successfully',
    data: result,
  });
});

const revokeCaseAccess = catchAsync(async (req: Request, res: Response) => {
  const { caseId, userId } = req.params;
  const result = await CaseAccessService.revokeAccess(caseId, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Access revoked successfully',
    data: result,
  });
});

export const CaseAccessController = {
  shareCase,
  getCaseSharedUsers,
  revokeCaseAccess,
};
