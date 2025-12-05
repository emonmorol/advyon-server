/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../errors/appError';
import { User } from '../user/user.model';
import { ClientProfile, LawyerProfile, JudgeProfile } from '../user/profile.model';
import { TOnboardPayload, TUpdateProfilePayload } from './auth.interface';
import { generateUserId, getUserWithProfile } from './auth.utils';

/**
 * Sync user from Clerk
 * Creates a new user if doesn't exist, returns existing user otherwise
 */
const syncUserFromClerk = async (clerkUserId: string, email: string) => {
  // Check if user already exists
  const existingUser = await User.findOne({ clerkUserId });

  if (existingUser) {
    // Update last login time
    existingUser.lastLoginAt = new Date();
    await existingUser.save();

    return {
      id: existingUser.id,
      clerkUserId: existingUser.clerkUserId,
      email: existingUser.email,
      role: existingUser.role,
      status: existingUser.status,
      needsOnboarding: existingUser.status === 'in-progress' || !existingUser.role,
    };
  }

  // Create new user with temporary default role
  const userId = await generateUserId('client'); // Temporary default

  const newUser = await User.create({
    id: userId,
    clerkUserId,
    email,
    role: 'client', // Temporary default, will be set during onboarding
    status: 'in-progress',
    fullName: email.split('@')[0], // Temporary, will be updated during onboarding
    isEmailVerified: true, // Clerk handles email verification
    needsPasswordChange: false, // Clerk handles authentication
    lastLoginAt: new Date(),
  });

  return {
    id: newUser.id,
    clerkUserId: newUser.clerkUserId,
    email: newUser.email,
    role: newUser.role,
    status: newUser.status,
    needsOnboarding: true,
  };
};

/**
 * Onboard user with role selection and profile creation
 */
const onboardUser = async (clerkUserId: string, payload: TOnboardPayload) => {
  // Find user by Clerk ID
  const user = await User.findOne({ clerkUserId });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user can change role
  const canChangeRole =
    user.status === 'in-progress' ||
    (user.status === 'active' && (!user.role || user.role === 'client'));

  if (!canChangeRole) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Role has already been set and cannot be changed',
    );
  }

  // If role is changing, generate new ID
  let newUserId = user.id;
  if (user.role !== payload.role) {
    newUserId = await generateUserId(payload.role);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Update user data
    user.id = newUserId;
    user.role = payload.role;
    user.fullName = payload.profile.fullName;
    user.displayName = payload.profile.displayName;
    user.avatarUrl = payload.profile.avatarUrl;
    user.preferredLanguage = payload.profile.preferredLanguage;
    user.timezone = payload.profile.timezone;
    user.status = 'active';

    await user.save({ session });

    // Create role-specific profile
    let profile: any = null;

    switch (payload.role) {
      case 'client':
        profile = await ClientProfile.create(
          [
            {
              id: `CP-${newUserId}`,
              userId: user._id,
              phoneNumber: payload.profile.phone,
              address: payload.profile.address,
            },
          ],
          { session },
        );
        break;

      case 'lawyer':
        profile = await LawyerProfile.create(
          [
            {
              id: `LP-${newUserId}`,
              userId: user._id,
              barRegistrationNumber: payload.profile.barRegistrationNumber!,
              barCouncilName: payload.profile.barCouncilName!,
              yearsOfExperience: payload.profile.yearsOfExperience,
              primaryPracticeArea: payload.profile.primaryPracticeArea,
              verificationStatus: 'pending',
            },
          ],
          { session },
        );
        break;

      case 'judge':
        profile = await JudgeProfile.create(
          [
            {
              id: `JP-${newUserId}`,
              userId: user._id,
              courtName: payload.profile.courtName!,
              designation: payload.profile.designation!,
              verificationStatus: 'pending',
            },
          ],
          { session },
        );
        break;
    }

    await session.commitTransaction();
    await session.endSession();

    // Return user with profile
    return await getUserWithProfile(newUserId, payload.role);
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to onboard user',
    );
  }
};

/**
 * Get current user with profile
 */
const getCurrentUser = async (clerkUserId: string) => {
  const user = await User.findOne({ clerkUserId });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user.role) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'User has not completed onboarding',
    );
  }

  return await getUserWithProfile(user.id, user.role);
};

/**
 * Update user profile
 */
const updateUserProfile = async (
  clerkUserId: string,
  payload: TUpdateProfilePayload,
) => {
  const user = await User.findOne({ clerkUserId });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.status !== 'active') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'User must complete onboarding first',
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Update user fields
    if (payload.fullName) user.fullName = payload.fullName;
    if (payload.displayName !== undefined) user.displayName = payload.displayName;
    if (payload.avatarUrl !== undefined) user.avatarUrl = payload.avatarUrl;
    if (payload.preferredLanguage !== undefined)
      user.preferredLanguage = payload.preferredLanguage;
    if (payload.timezone !== undefined) user.timezone = payload.timezone;

    await user.save({ session });

    // Update role-specific profile
    switch (user.role) {
      case 'client':
        await ClientProfile.findOneAndUpdate(
          { userId: user._id },
          {
            phoneNumber: payload.phone,
            address: payload.address,
          },
          { session, new: true },
        );
        break;

      case 'lawyer':
        await LawyerProfile.findOneAndUpdate(
          { userId: user._id },
          {
            barRegistrationNumber: payload.barRegistrationNumber,
            barCouncilName: payload.barCouncilName,
            yearsOfExperience: payload.yearsOfExperience,
            primaryPracticeArea: payload.primaryPracticeArea,
          },
          { session, new: true },
        );
        break;

      case 'judge':
        await JudgeProfile.findOneAndUpdate(
          { userId: user._id },
          {
            courtName: payload.courtName,
            designation: payload.designation,
          },
          { session, new: true },
        );
        break;
    }

    await session.commitTransaction();
    await session.endSession();

    return await getUserWithProfile(user.id, user.role);
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to update profile',
    );
  }
};

export const AuthServices = {
  syncUserFromClerk,
  onboardUser,
  getCurrentUser,
  updateUserProfile,
};
