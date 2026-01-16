/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../config';
import AppError from '../../errors/appError';
import { TUser } from './user.interface';
import { User } from './user.model';
import { ClientProfile, JudgeProfile, LawyerProfile } from './profile.model';
import {
  generateAdminId,
  generateClientId,
  generateJudgeId,
  generateLawyerId,
} from './user.utils';
import { UserRole } from './user-role.model';
import { Role } from './role.model';

const createUser = async (file: any, payload: any) => {
  const { password, user: userData, client, lawyer, judge } = payload;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    userData.password = password || (config.default_password as string);

    let generatedId = '';
    if (userData.role === 'client') {
      generatedId = await generateClientId();
    } else if (userData.role === 'lawyer') {
      generatedId = await generateLawyerId();
    } else if (userData.role === 'judge') {
      generatedId = await generateJudgeId();
    } else if (userData.role === 'admin') {
      generatedId = await generateAdminId();
    } else {
        // Fallback or error
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid role for user creation');
    }

    userData.id = generatedId;

    // Create User
    const newUser = await User.create([userData], { session });

    if (!newUser.length) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create user');
    }

    const userId = newUser[0].id;
    const user_id = newUser[0]._id; // ObjectId

    // Create Profile based on role
    if (userData.role === 'client' && client) {
      client.id = userId;
      client.userId = user_id;
      await ClientProfile.create([client], { session });
    } else if (userData.role === 'lawyer' && lawyer) {
      lawyer.id = userId;
      lawyer.userId = user_id;
      await LawyerProfile.create([lawyer], { session });
    } else if (userData.role === 'judge' && judge) {
      judge.id = userId;
      judge.userId = user_id;
      await JudgeProfile.create([judge], { session });
    }

    // Assign Role (UserRole)
    // Assuming Role exists. If not, we might need to find it or create it.
    // For now, I'll assume the `role` string in User is enough, but if we need `UserRole` table:
    // I need to find the Role by code (e.g. 'client').
    // const roleDoc = await Role.findOne({ code: userData.role });
    // if (roleDoc) {
    //   await UserRole.create([{
    //       id: userId, // or generate unique ID for UserRole
    //       userId: newUser[0].id,
    //       roleId: roleDoc.id,
    //       isPrimary: true
    //   }], { session });
    // }

    await session.commitTransaction();
    await session.endSession();

    return newUser[0];
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const users = await User.find(query);
  return users;
};

const getSingleUser = async (id: string) => {
  const user = await User.findOne({ id });
  return user;
};

const updateUser = async (id: string, payload: Partial<TUser>) => {
  const result = await User.findOneAndUpdate({ id }, payload, {
    new: true,
  });
  return result;
};

const deleteUser = async (id: string) => {
  const result = await User.findOneAndUpdate(
    { id },
    { isDeleted: true },
    { new: true },
  );
  return result;
};


const getMyProfile = async (userId: string) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Fetch basic details
  const profile: any = {
    email: user.email,
    displayName: user.displayName || user.fullName,
    phone: '', // Placeholder
    address: '', // Placeholder
  };

  // Try to fetch additional details from role-specific profiles
  // This is a simplified lookup; in a real app, we'd use the relationship
  // Assuming the user.id is the link or user._id
  let roleProfile: any;
  if (user.role === 'client') {
    roleProfile = await ClientProfile.findOne({ id: userId });
  } else if (user.role === 'lawyer') {
    roleProfile = await LawyerProfile.findOne({ id: userId });
  } else if (user.role === 'judge') {
    roleProfile = await JudgeProfile.findOne({ id: userId });
  }

  if (roleProfile) {
    profile.phone = roleProfile.phoneNumber || roleProfile.contactNumber || '';
    profile.address = roleProfile.address || '';
  }

  return profile;
};

// Phase 1.1: Get User Preferences
const getPreferences = async (userId: string) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  
  // Return preferences with defaults if not set
  return user.preferences || {
    theme: 'system',
    notifications: {
      emailDigest: true,
      pushAlerts: false,
      hearingReminders: true,
    },
    dashboardConfig: {
      showActivityFeed: true,
      showAIInsights: true,
      defaultView: 'classic',
    },
  };
};

// Phase 1.1: Update User Preferences
const updatePreferences = async (userId: string, preferences: any) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  
  // Merge existing preferences with new ones (deep merge)
  const currentPrefs = user.preferences as any || {};
  const mergedPreferences = {
    theme: preferences.theme ?? currentPrefs.theme ?? 'system',
    notifications: {
      emailDigest: preferences.notifications?.emailDigest ?? currentPrefs.notifications?.emailDigest ?? true,
      pushAlerts: preferences.notifications?.pushAlerts ?? currentPrefs.notifications?.pushAlerts ?? false,
      hearingReminders: preferences.notifications?.hearingReminders ?? currentPrefs.notifications?.hearingReminders ?? true,
    },
    dashboardConfig: {
      showActivityFeed: preferences.dashboardConfig?.showActivityFeed ?? currentPrefs.dashboardConfig?.showActivityFeed ?? true,
      showAIInsights: preferences.dashboardConfig?.showAIInsights ?? currentPrefs.dashboardConfig?.showAIInsights ?? true,
      defaultView: preferences.dashboardConfig?.defaultView ?? currentPrefs.dashboardConfig?.defaultView ?? 'classic',
    },
  };
  
  const result = await User.findOneAndUpdate(
    { id: userId },
    { preferences: mergedPreferences },
    { new: true }
  );
  
  return result?.preferences;
};

// Update own profile (for profile page)
const updateMyProfile = async (userId: string, payload: Partial<TUser>) => {
  const user = await User.findOne({ id: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Fields that can be updated by the user (exclude sensitive fields like email, role, password)
  const allowedFields = [
    'fullName',
    'displayName',
    'avatarUrl',
    'preferredLanguage',
    'timezone',
    'phone',
    'address',
    'bio',
  ];

  const updateData: any = {};
  for (const field of allowedFields) {
    if ((payload as any)[field] !== undefined) {
      updateData[field] = (payload as any)[field];
    }
  }

  const result = await User.findOneAndUpdate(
    { id: userId },
    updateData,
    { new: true }
  );

  // Also update role-specific profile if phone/address changed
  if (payload.phone || payload.address) {
    if (user.role === 'client') {
      await ClientProfile.findOneAndUpdate(
        { userId: user._id },
        { 
          ...(payload.phone && { phoneNumber: payload.phone }),
          ...(payload.address && { address: payload.address }),
        },
        { upsert: true }
      );
    } else if (user.role === 'lawyer') {
      await LawyerProfile.findOneAndUpdate(
        { userId: user._id },
        { 
          ...(payload.phone && { phoneNumber: payload.phone }),
          ...(payload.address && { address: payload.address }),
        },
        { upsert: true }
      );
    }
  }

  return result;
};

// Change password
const changePassword = async (
  userId: string, 
  currentPassword: string, 
  newPassword: string
) => {
  const user = await User.findOne({ id: userId }).select('+password');
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if current password is correct
  if (user.password) {
    const isPasswordValid = await User.isPasswordMatched(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Current password is incorrect');
    }
  }

  // Hash and update new password
  const bcrypt = await import('bcrypt');
  const saltRounds = Number(config.bcrypt_salt_rounds) || 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  const result = await User.findOneAndUpdate(
    { id: userId },
    { 
      password: hashedPassword,
      passwordChangedAt: new Date(),
      needsPasswordChange: false,
    },
    { new: true }
  );

  return { message: 'Password changed successfully' };
};

export const UserServices = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getMyProfile,
  getPreferences,
  updatePreferences,
  updateMyProfile,
  changePassword,
};

