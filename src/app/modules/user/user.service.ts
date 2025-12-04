/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../config';
import AppError from '../../errors/appError';
import { TUser } from './user.interface';
import { User } from './user.model';
import { ClientProfile, JudgeProfile, LawyerProfile } from './profile.model';
import {
  generateAdminId,
  generateClientId,
  generateJudgeId,
  generateLawyerId,
} from './user.utils';
import { UserRole } from './user-role.model';
import { Role } from './role.model';

const createUser = async (file: any, payload: any) => {
  const { password, user: userData, client, lawyer, judge } = payload;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    userData.password = password || (config.default_password as string);

    let generatedId = '';
    if (userData.role === 'client') {
      generatedId = await generateClientId();
    } else if (userData.role === 'lawyer') {
      generatedId = await generateLawyerId();
    } else if (userData.role === 'judge') {
      generatedId = await generateJudgeId();
    } else if (userData.role === 'admin') {
      generatedId = await generateAdminId();
    } else {
        // Fallback or error
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid role for user creation');
    }

    userData.id = generatedId;

    // Create User
    const newUser = await User.create([userData], { session });

    if (!newUser.length) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create user');
    }

    const userId = newUser[0].id;
    const user_id = newUser[0]._id; // ObjectId

    // Create Profile based on role
    if (userData.role === 'client' && client) {
      client.id = userId;
      client.userId = user_id;
      await ClientProfile.create([client], { session });
    } else if (userData.role === 'lawyer' && lawyer) {
      lawyer.id = userId;
      lawyer.userId = user_id;
      await LawyerProfile.create([lawyer], { session });
    } else if (userData.role === 'judge' && judge) {
      judge.id = userId;
      judge.userId = user_id;
      await JudgeProfile.create([judge], { session });
    }

    // Assign Role (UserRole)
    // Assuming Role exists. If not, we might need to find it or create it.
    // For now, I'll assume the `role` string in User is enough, but if we need `UserRole` table:
    // I need to find the Role by code (e.g. 'client').
    // const roleDoc = await Role.findOne({ code: userData.role });
    // if (roleDoc) {
    //   await UserRole.create([{
    //       id: userId, // or generate unique ID for UserRole
    //       userId: newUser[0].id,
    //       roleId: roleDoc.id,
    //       isPrimary: true
    //   }], { session });
    // }

    await session.commitTransaction();
    await session.endSession();

    return newUser[0];
  } catch (err: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const users = await User.find(query);
  return users;
};

const getSingleUser = async (id: string) => {
  const user = await User.findOne({ id });
  return user;
};

const updateUser = async (id: string, payload: Partial<TUser>) => {
  const result = await User.findOneAndUpdate({ id }, payload, {
    new: true,
  });
  return result;
};

const deleteUser = async (id: string) => {
  const result = await User.findOneAndUpdate(
    { id },
    { isDeleted: true },
    { new: true },
  );
  return result;
};

export const UserServices = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
};
