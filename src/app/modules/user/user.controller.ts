import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserServices } from './user.service';

const createUser = catchAsync(async (req, res) => {
  const result = await UserServices.createUser(req.file, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User is created succesfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUsers(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users retrieved successfully',
    data: result,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.getSingleUser(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.updateUser(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User updated successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserServices.deleteUser(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});


const getMyProfile = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await UserServices.getSingleUser(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

// Phase 1.1: Get My Preferences
const getMyPreferences = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await UserServices.getPreferences(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User preferences retrieved successfully',
    data: result,
  });
});

// Phase 1.1: Update My Preferences
const updateMyPreferences = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await UserServices.updatePreferences(userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User preferences updated successfully',
    data: result,
  });
});

// Update my profile
const updateMyProfile = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await UserServices.updateMyProfile(userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

// Change password
const changePassword = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Current password and new password are required',
      data: null,
    });
    return;
  }
  
  const result = await UserServices.changePassword(userId, currentPassword, newPassword);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});

export const UserControllers = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getMyProfile,
  getMyPreferences,
  updateMyPreferences,
  updateMyProfile,
  changePassword,
};

