export const VERIFICATION_STATUS = {
  pending: 'pending',
  verified: 'verified',
  rejected: 'rejected',
} as const;

export const ONBOARDING_ROLES = {
  client: 'client',
  lawyer: 'lawyer',
  judge: 'judge',
} as const;

export const USER_STATUS = {
  inProgress: 'in-progress',
  active: 'active',
  blocked: 'blocked',
  inactive: 'inactive',
} as const;

export type TVerificationStatus = keyof typeof VERIFICATION_STATUS;
export type TOnboardingRole = keyof typeof ONBOARDING_ROLES;
export type TUserStatus = keyof typeof USER_STATUS;
