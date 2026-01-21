import { Schema, model } from 'mongoose';
import { TClientProfile, TJudgeProfile, TLawyerProfile } from './user.interface';

const clientProfileSchema = new Schema<TClientProfile>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      ref: 'User',
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const ClientProfile = model<TClientProfile>(
  'ClientProfile',
  clientProfileSchema,
);

const lawyerProfileSchema = new Schema<TLawyerProfile>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      ref: 'User',
    },
    barRegistrationNumber: {
      type: String,
      required: true,
    },
    barCouncilName: {
      type: String,
      required: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
    },
    primaryPracticeArea: {
      type: String,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verificationNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const LawyerProfile = model<TLawyerProfile>(
  'LawyerProfile',
  lawyerProfileSchema,
);

const judgeProfileSchema = new Schema<TJudgeProfile>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      ref: 'User',
    },
    courtName: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    verificationStatus: {
      type: String,
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

export const JudgeProfile = model<TJudgeProfile>(
  'JudgeProfile',
  judgeProfileSchema,
);
