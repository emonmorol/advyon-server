export const USER_ROLE = {
  superAdmin: 'superAdmin',
  admin: 'admin',
  student: 'student',
  client: 'client',
  lawyer: 'lawyer',
  judge: 'judge',
} as const;

export const UserStatus = ['in-progress', 'blocked', 'active', 'inactive'];
