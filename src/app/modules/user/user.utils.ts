import { User } from './user.model';

// ... (removed findLastStudentId and generateStudentId)

// Faculty ID removed as per cleanup

// Admin ID
export const findLastAdminId = async () => {
  const lastAdmin = await User.findOne(
    {
      role: 'admin',
    },
    {
      id: 1,
      _id: 0,
    },
  )
    .sort({
      createdAt: -1,
    })
    .lean();

  return lastAdmin?.id ? lastAdmin.id.substring(2) : undefined;
};

export const generateAdminId = async () => {
  let currentId = (0).toString();
  const lastAdminId = await findLastAdminId();

  if (lastAdminId) {
    currentId = lastAdminId.substring(2);
  }

  let incrementId = (Number(currentId) + 1).toString().padStart(4, '0');

  incrementId = `A-${incrementId}`;
  return incrementId;
};

// Client ID
export const findLastClientId = async () => {
  const lastClient = await User.findOne(
    {
      role: 'client',
    },
    {
      id: 1,
      _id: 0,
    },
  )
    .sort({
      createdAt: -1,
    })
    .lean();

  return lastClient?.id ? lastClient.id.substring(2) : undefined;
};

export const generateClientId = async () => {
  let currentId = (0).toString();
  const lastClientId = await findLastClientId();

  if (lastClientId) {
    currentId = lastClientId.substring(2);
  }

  let incrementId = (Number(currentId) + 1).toString().padStart(4, '0');

  incrementId = `C-${incrementId}`;
  return incrementId;
};

// Lawyer ID
export const findLastLawyerId = async () => {
  const lastLawyer = await User.findOne(
    {
      role: 'lawyer',
    },
    {
      id: 1,
      _id: 0,
    },
  )
    .sort({
      createdAt: -1,
    })
    .lean();

  return lastLawyer?.id ? lastLawyer.id.substring(2) : undefined;
};

export const generateLawyerId = async () => {
  let currentId = (0).toString();
  const lastLawyerId = await findLastLawyerId();

  if (lastLawyerId) {
    currentId = lastLawyerId.substring(2);
  }

  let incrementId = (Number(currentId) + 1).toString().padStart(4, '0');

  incrementId = `L-${incrementId}`;
  return incrementId;
};

// Judge ID
export const findLastJudgeId = async () => {
  const lastJudge = await User.findOne(
    {
      role: 'judge',
    },
    {
      id: 1,
      _id: 0,
    },
  )
    .sort({
      createdAt: -1,
    })
    .lean();

  return lastJudge?.id ? lastJudge.id.substring(2) : undefined;
};

export const generateJudgeId = async () => {
  let currentId = (0).toString();
  const lastJudgeId = await findLastJudgeId();

  if (lastJudgeId) {
    currentId = lastJudgeId.substring(2);
  }

  let incrementId = (Number(currentId) + 1).toString().padStart(4, '0');

  incrementId = `J-${incrementId}`;
  return incrementId;
};
