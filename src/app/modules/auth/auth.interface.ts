/* eslint-disable no-unused-vars */

// Clerk JWT payload structure
export interface TClerkJWTPayload {
  sub: string; // Clerk user ID
  email: string;
  email_verified?: boolean;
  iat?: number;
  exp?: number;
}

// Sync user payload (extracted from Clerk JWT)
export interface TSyncUserPayload {
  clerkUserId: string;
  email: string;
  emailVerified?: boolean;
}

// Onboarding payload from frontend
export interface TOnboardPayload {
  role: 'client' | 'lawyer' | 'judge';
  profile: {
    // Common fields (all roles)
    fullName: string;
    displayName?: string;
    phone?: string;
    avatarUrl?: string;
    preferredLanguage?: string;
    timezone?: string;

    // Client-specific fields
    address?: string;

    // Lawyer-specific fields
    barRegistrationNumber?: string;
    barCouncilName?: string;
    yearsOfExperience?: number;
    primaryPracticeArea?: string;

    // Judge-specific fields
    courtName?: string;
    designation?: string;
  };
}

// Update profile payload
export interface TUpdateProfilePayload {
  // User table fields
  fullName?: string;
  displayName?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  timezone?: string;

  // Profile fields (role-specific)
  phone?: string;
  address?: string;
  barRegistrationNumber?: string;
  barCouncilName?: string;
  yearsOfExperience?: number;
  primaryPracticeArea?: string;
  courtName?: string;
  designation?: string;
}

// Auth response
export interface TAuthResponse {
  success: boolean;
  data: {
    id: string;
    clerkUserId: string;
    email: string;
    role?: string;
    status: string;
    needsOnboarding: boolean;
  };
}

// Profile response (combined user + profile)
export interface TProfileResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      clerkUserId: string;
      email: string;
      fullName: string;
      displayName?: string;
      avatarUrl?: string;
      role: string;
      status: string;
      preferredLanguage?: string;
      timezone?: string;
      isEmailVerified: boolean;
      lastLoginAt?: Date;
    };
    profile:
      | {
          type: 'client';
          phoneNumber?: string;
          address?: string;
        }
      | {
          type: 'lawyer';
          barRegistrationNumber: string;
          barCouncilName: string;
          yearsOfExperience?: number;
          primaryPracticeArea?: string;
          verificationStatus: string;
          verificationNotes?: string;
        }
      | {
          type: 'judge';
          courtName: string;
          designation: string;
          verificationStatus: string;
        }
      | null;
  };
}
