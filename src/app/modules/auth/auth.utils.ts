import { User } from '../user/user.model';
import { ClientProfile } from '../user/profile.model';
import { LawyerProfile } from '../user/profile.model';
import { JudgeProfile } from '../user/profile.model';

// Generate role-based user IDs
const findLastUserIdByRole = async (role: string): Promise<string | undefined> => {
  const lastUser = await User.findOne(
    { role },
    { id: 1, _id: 0 }
  )
    .sort({ createdAt: -1 })
    .lean();

  return lastUser?.id;
};

export const generateUserId = async (role: string): Promise<string> => {
  let prefix = '';
  
  switch (role) {
    case 'client':
      prefix = 'CLI';
      break;
    case 'lawyer':
      prefix = 'LAW';
      break;
    case 'judge':
      prefix = 'JUD';
      break;
    case 'admin':
      prefix = 'ADM';
      break;
    default:
      prefix = 'USR';
  }

  const lastUserId = await findLastUserIdByRole(role);
  let currentId = '0000';

  if (lastUserId) {
    // Extract the numeric part after the prefix and hyphen
    const numericPart = lastUserId.substring(4); // After "XXX-"
    currentId = numericPart;
  }

  const incrementId = (Number(currentId) + 1).toString().padStart(4, '0');
  return `${prefix}-${incrementId}`;
};

// Fetch user with their role-specific profile
export const getUserWithProfile = async (userId: string, role: string) => {
  const user = await User.findOne({ id: userId }).lean();
  
  if (!user) {
    return null;
  }

  let profile = null;

  switch (role) {
    case 'client':
      profile = await ClientProfile.findOne({ userId: user._id }).lean();
      if (profile) {
        profile = {
          type: 'client',
          phoneNumber: profile.phoneNumber,
          address: profile.address,
        };
      }
      break;
    
    case 'lawyer':
      profile = await LawyerProfile.findOne({ userId: user._id }).lean();
      if (profile) {
        profile = {
          type: 'lawyer',
          barRegistrationNumber: profile.barRegistrationNumber,
          barCouncilName: profile.barCouncilName,
          yearsOfExperience: profile.yearsOfExperience,
          primaryPracticeArea: profile.primaryPracticeArea,
          verificationStatus: profile.verificationStatus,
          verificationNotes: profile.verificationNotes,
        };
      }
      break;
    
    case 'judge':
      profile = await JudgeProfile.findOne({ userId: user._id }).lean();
      if (profile) {
        profile = {
          type: 'judge',
          courtName: profile.courtName,
          designation: profile.designation,
          verificationStatus: profile.verificationStatus,
        };
      }
      break;
  }

  return {
    user: {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      fullName: user.fullName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
    },
    profile,
  };
};
