import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';

/**
 * Sync user from Clerk
 * POST /auth/sync
 */
const syncUser = catchAsync(async (req, res) => {
  const { clerkUserId, email } = req.user; // From Clerk JWT

  const result = await AuthServices.syncUserFromClerk(clerkUserId, email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User synced successfully',
    data: result,
  });
});

/**
 * Onboard user with role selection
 * POST /auth/onboard
 */
const onboardUser = catchAsync(async (req, res) => {
  const { clerkUserId } = req.user; // From Clerk JWT

  const result = await AuthServices.onboardUser(clerkUserId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User onboarded successfully',
    data: result,
  });
});

/**
 * Get current user with profile
 * GET /auth/me
 */
const getCurrentUser = catchAsync(async (req, res) => {
  const { clerkUserId } = req.user; // From Clerk JWT

  const result = await AuthServices.getCurrentUser(clerkUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

/**
 * Update current user profile
 * PATCH /auth/me
 */
const updateProfile = catchAsync(async (req, res) => {
  const { clerkUserId } = req.user; // From Clerk JWT

  const result = await AuthServices.updateUserProfile(clerkUserId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

export const AuthControllers = {
  syncUser,
  onboardUser,
  getCurrentUser,
  updateProfile,
};
