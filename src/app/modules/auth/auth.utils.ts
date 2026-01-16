import { User } from '../user/user.model';
import { ClientProfile } from '../user/profile.model';
import { LawyerProfile } from '../user/profile.model';
import { JudgeProfile } from '../user/profile.model';

// Generate role-based user IDs
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

  // Find the last user by ID (lexicographical sort works for fixed-length strings like CLI-0001)
  const lastUser = await User.findOne(
    { role },
    { id: 1, _id: 0 }
  )
    .sort({ id: -1 })
    .lean();

  let currentId = '0000';

  if (lastUser && lastUser.id) {
    // Extract the numeric part after the prefix and hyphen
    // Format: PRE-XXXX
    const lastIdParts = lastUser.id.split('-');
    if (lastIdParts.length === 2 && !isNaN(Number(lastIdParts[1]))) {
      currentId = lastIdParts[1];
    }
  }

  let incrementVal = Number(currentId) + 1;
  let incrementId = incrementVal.toString().padStart(4, '0');
  let finalId = `${prefix}-${incrementId}`;

  // Safety check: collision detection loop
  // This ensures we never produce a duplicate even if the sort failed or there are gaps
  // Also checks for orphan profiles (profiles that exist without a corresponding user)
  while (true) {
    // Check User collection
    const userExists = await User.findOne({ id: finalId });
    if (userExists) {
      incrementVal++;
      incrementId = incrementVal.toString().padStart(4, '0');
      finalId = `${prefix}-${incrementId}`;
      continue;
    }

    // Check Profile collections for orphans
    let profileExists = null;
    if (role === 'client') {
      profileExists = await ClientProfile.findOne({ id: `CP-${finalId}` });
    } else if (role === 'lawyer') {
      profileExists = await LawyerProfile.findOne({ id: `LP-${finalId}` });
    } else if (role === 'judge') {
      profileExists = await JudgeProfile.findOne({ id: `JP-${finalId}` });
    }

    if (profileExists) {
      incrementVal++;
      incrementId = incrementVal.toString().padStart(4, '0');
      finalId = `${prefix}-${incrementId}`;
      continue;
    }

    // If neither exists, we are safe
    break;
  }

  return finalId;
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
