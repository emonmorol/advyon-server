import { Schema, model } from 'mongoose';
import { TUserRoleData } from './user.interface';

const userRoleSchema = new Schema<TUserRoleData>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    roleId: {
      type: String,
      required: true,
      ref: 'Role',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    createdByUserId: {
      type: String,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

export const UserRole = model<TUserRoleData>('UserRole', userRoleSchema);
