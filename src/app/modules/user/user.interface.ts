/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';
import { USER_ROLE } from './user.constant';

// User Preferences Types for Phase 1.1
export interface TNotificationPreferences {
  emailDigest: boolean;
  pushAlerts: boolean;
  hearingReminders: boolean;
}

export interface TDashboardConfig {
  showActivityFeed: boolean;
  showAIInsights: boolean;
  defaultView: 'classic' | 'kanban';
}

export interface TUserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: TNotificationPreferences;
  dashboardConfig: TDashboardConfig;
}

export interface TRole {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface TUserRoleData {
  id: string;
  userId: string;
  roleId: string;
  isPrimary: boolean;
  createdAt: Date;
  createdByUserId?: string;
}

export interface TClientProfile {
  id: string;
  userId: string;
  phoneNumber?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TLawyerProfile {
  id: string;
  userId: string;
  barRegistrationNumber: string;
  barCouncilName: string;
  yearsOfExperience: number;
  primaryPracticeArea: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TJudgeProfile {
  id: string;
  userId: string;
  courtName: string;
  designation: string;
  verificationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TUser {
  id: string;
  clerkUserId?: string;
  email: string;
  password?: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  primaryRole?: string;
  isEmailVerified: boolean;
  preferredLanguage?: string;
  timezone?: string;
  phone?: string;
  address?: string;
  bio?: string;
  status: 'in-progress' | 'blocked' | 'active' | 'inactive';
  lastLoginAt?: Date;
  needsPasswordChange: boolean;
  passwordChangedAt?: Date;
  role: 'superAdmin' | 'admin' | 'student' | 'client' | 'lawyer' | 'judge';
  isDeleted: boolean;
  preferences?: TUserPreferences; // Phase 1.1: User Preferences
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserModel extends Model<TUser> {
  //instance methods for checking if the user exist
  isUserExistsByCustomId(id: string): Promise<TUser>;
  //instance methods for checking if passwords are matched
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date,
    jwtIssuedTimestamp: number,
  ): boolean;
}

export type TUserRole = keyof typeof USER_ROLE;
