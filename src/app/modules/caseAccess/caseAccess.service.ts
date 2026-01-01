import { Types } from 'mongoose';
import { CaseAccessModel } from './caseAccess.model';
import { TCaseAccess } from './caseAccess.interface';
import { User } from '../user/user.model';
import AppError from '../../errors/appError';
import httpStatus from 'http-status';

const shareCaseWithUser = async (userId: string, payload: Partial<TCaseAccess>, grantedBy: string) => {
  // Find recipient by email or ID (payload.userId might be an email from frontend)
  let recipient;
  if (Types.ObjectId.isValid(payload.userId as any)) {
      recipient = await User.findById(payload.userId);
  } else {
      recipient = await User.findOne({ email: payload.userId as any });
  }

  if (!recipient) {
    throw new AppError(httpStatus.NOT_FOUND, 'Recipient user not found');
  }

  const result = await CaseAccessModel.findOneAndUpdate(
    { caseId: payload.caseId, userId: recipient._id },
    { 
        ...payload, 
        userId: recipient._id,
        grantedBy, 
        status: 'active' 
    },
    { upsert: true, new: true },
  );

  return result;
};

const getSharedUsersForCase = async (caseId: string) => {
  const result = await CaseAccessModel.find({ caseId, status: 'active' })
    .populate('userId', 'fullName email profileImg')
    .sort({ createdAt: -1 });
  return result;
};

const revokeAccess = async (caseId: string, userId: string) => {
  const result = await CaseAccessModel.findOneAndUpdate(
    { caseId, userId },
    { status: 'revoked' },
    { new: true },
  );
  return result;
};

export const CaseAccessService = {
  shareCaseWithUser,
  getSharedUsersForCase,
  revokeAccess,
};
