// src/app/modules/user/admin/admin.service.ts
import httpStatus from 'http-status';
import { User } from '../user/user.model';
import AppError from '../../errors/appError';
import {
  TUserFilter,
  TUserRole,
  TUserStatus,
  TPaginationOptions,
} from './admin.interface';
import { ADMIN_ERROR_MESSAGES } from './admin.constant';

const getAllUsers = async (
  filters: TUserFilter,
  options: TPaginationOptions,
): Promise<{ meta: { total: number; page: number; limit: number }; data: any[] }> => {
  const { search, role, status } = filters;
  const andConditions: any[] = [{ isDeleted: false }];

  if (search) {
    andConditions.push({
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } },
      ],
    });
  }

  if (role) {
    andConditions.push({ role });
  }

  if (status) {
    andConditions.push({ status });
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {};

  const result = await User.find(whereConditions)
    .skip(options.skip)
    .limit(options.limit)
    .sort(options.sort)
    .select('-password');

  const total = await User.countDocuments(whereConditions);

  return {
    meta: { total, page: options.page, limit: options.limit },
    data: result,
  };
};

const getSingleUser = async (id: string): Promise<any> => {
  const user = await User.findById(id).select('-password');

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      ADMIN_ERROR_MESSAGES.USER_NOT_FOUND,
    );
  }

  if (user.isDeleted) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      ADMIN_ERROR_MESSAGES.USER_NOT_FOUND,
    );
  }

  return user;
};

const updateUserRole = async (
  id: string,
  role: TUserRole,
  requestingUserId: string,
): Promise<any> => {
  // Prevent self-modification
  const requestingUser = await User.findOne({ id: requestingUserId });
  if (requestingUser?._id.toString() === id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      ADMIN_ERROR_MESSAGES.CANNOT_MODIFY_SELF,
    );
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      ADMIN_ERROR_MESSAGES.USER_NOT_FOUND,
    );
  }

  if (user.isDeleted) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      ADMIN_ERROR_MESSAGES.USER_NOT_FOUND,
    );
  }

  // If changing FROM superAdmin, check if they're the last one
  if (user.role === 'superAdmin' && role !== 'superAdmin') {
    const superAdminCount = await User.countDocuments({
      role: 'superAdmin',
      isDeleted: false,
      status: { $ne: 'blocked' },
    });

    if (superAdminCount <= 1) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        ADMIN_ERROR_MESSAGES.CANNOT_DELETE_LAST_SUPERADMIN,
      );
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true },
  ).select('-password');

  return updatedUser;
};

const updateUserStatus = async (
  id: string,
  status: TUserStatus,
  requestingUserId: string,
): Promise<any> => {
  // Prevent self-modification
  const requestingUser = await User.findOne({ id: requestingUserId });
  if (requestingUser?._id.toString() === id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      ADMIN_ERROR_MESSAGES.CANNOT_MODIFY_SELF,
    );
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      ADMIN_ERROR_MESSAGES.USER_NOT_FOUND,
    );
  }

  if (user.isDeleted) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      ADMIN_ERROR_MESSAGES.USER_NOT_FOUND,
    );
  }

  // Prevent blocking the last superAdmin
  if (user.role === 'superAdmin' && status === 'blocked') {
    const activeSuperAdminCount = await User.countDocuments({
      role: 'superAdmin',
      isDeleted: false,
      status: { $ne: 'blocked' },
    });

    if (activeSuperAdminCount <= 1) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        ADMIN_ERROR_MESSAGES.CANNOT_BLOCK_LAST_SUPERADMIN,
      );
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  ).select('-password');

  return updatedUser;
};

const softDeleteUser = async (
  id: string,
  requestingUserId: string,
): Promise<any> => {
  // Prevent self-deletion
  const requestingUser = await User.findOne({ id: requestingUserId });
  if (requestingUser?._id.toString() === id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      ADMIN_ERROR_MESSAGES.CANNOT_MODIFY_SELF,
    );
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      ADMIN_ERROR_MESSAGES.USER_NOT_FOUND,
    );
  }

  if (user.isDeleted) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      ADMIN_ERROR_MESSAGES.USER_ALREADY_DELETED,
    );
  }

  // Prevent deleting the last superAdmin
  if (user.role === 'superAdmin') {
    const activeSuperAdminCount = await User.countDocuments({
      role: 'superAdmin',
      isDeleted: false,
    });

    if (activeSuperAdminCount <= 1) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        ADMIN_ERROR_MESSAGES.CANNOT_DELETE_LAST_SUPERADMIN,
      );
    }
  }

  const deletedUser = await User.findByIdAndUpdate(
    id,
    { isDeleted: true, status: 'blocked', deletedAt: new Date() },
    { new: true },
  ).select('-password');

  return deletedUser;
};

export const AdminService = {
  getAllUsers,
  getSingleUser,
  updateUserRole,
  updateUserStatus,
  softDeleteUser,
};
