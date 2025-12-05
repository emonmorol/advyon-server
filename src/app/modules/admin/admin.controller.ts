// src/app/modules/user/admin/admin.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

import { AdminService } from './admin.service';
import { TUserRole, TUserStatus } from './admin.interface';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from './admin.constant';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    search: req.query.search as string | undefined,
    role: req.query.role as TUserRole | undefined,
    status: req.query.status as TUserStatus | undefined,
  };

  const page = Number(req.query.page) || DEFAULT_PAGE;
  const limit = Number(req.query.limit) || DEFAULT_LIMIT;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? '' : '-';

  const options = {
    page,
    limit,
    sort: `${sortOrder}${sortBy}`,
    skip: (page - 1) * limit,
  };

  const result = await AdminService.getAllUsers(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users fetched successfully',
    data: result.data,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getSingleUser(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User fetched successfully',
    data: result,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const requestingUserId = req.user.userId;
  console.log(req.user)
  const result = await AdminService.updateUserRole(
    req.params.id,
    req.body.role,
    requestingUserId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User role updated successfully',
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const requestingUserId = req.user.userId;
  const result = await AdminService.updateUserStatus(
    req.params.id,
    req.body.status,
    requestingUserId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User status updated successfully',
    data: result,
  });
});

const softDeleteUser = catchAsync(async (req: Request, res: Response) => {
  const requestingUserId = req.user.userId;
  const result = await AdminService.softDeleteUser(
    req.params.id,
    requestingUserId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

export const AdminController = {
  getAllUsers,
  getSingleUser,
  updateUserRole,
  updateUserStatus,
  softDeleteUser,
};
