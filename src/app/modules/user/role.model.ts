import { Schema, model } from 'mongoose';
import { TRole } from './user.interface';

const roleSchema = new Schema<TRole>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const Role = model<TRole>('Role', roleSchema);
