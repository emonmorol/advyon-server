import { Types } from 'mongoose';

export type TAccessRole = 'viewer' | 'editor' | 'admin';

export interface TCaseAccess {
  caseId: Types.ObjectId;
  userId: Types.ObjectId; // User receiving access
  grantedBy: Types.ObjectId; // User giving access
  role: TAccessRole;
  expiresAt?: Date;
  status: 'active' | 'revoked' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}
