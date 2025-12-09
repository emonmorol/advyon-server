import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { verifyToken } from '@clerk/clerk-sdk-node';
import config from '../config';
import AppError from '../errors/appError';
import { TUserRole } from '../modules/user/user.interface';
import { User } from '../modules/user/user.model';
import catchAsync from '../utils/catchAsync';

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // Check if authorization header exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify Clerk JWT token
      const decoded = await verifyToken(token, {
        secretKey: config.clerk_secret_key as string,
        issuer: (iss) => iss.startsWith('https://'), // Accept any Clerk issuer
      });

      // Extract Clerk user data from JWT
      const clerkUserId = decoded.sub;
      const email = decoded.email as string;
      console.log('decoded => ', decoded);

      // Find user in database by Clerk ID
      const user = await User.findOne({ clerkUserId });

      if (!user) {
        // For /auth/sync endpoint, allow non-existent users
        if (req.path === '/sync') {
          req.user = {
            clerkUserId,
            email,
            emailVerified: decoded.email_verified as boolean,
          };
          return next();
        }
        throw new AppError(httpStatus.NOT_FOUND, 'This user is not found!');
      }

      // Check if user is deleted
      if (user.isDeleted) {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted!');
      }

      // Check if user is blocked
      if (user.status === 'blocked') {
        throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked!');
      }

      // Check role-based access
      // if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as TUserRole)) {
      //   throw new AppError(
      //     httpStatus.UNAUTHORIZED,
      //     'You are not authorized!',
      //   );
      // }

      // Attach user data to request
      req.user = {
        clerkUserId,
        email: email ? email : 'advyon@gmail.com',
        userId: user.id,
        role: user?.role ? (user.role as TUserRole) : 'client',
        emailVerified: true,
      };

      next();
    } catch (error: any) {
      // Handle Clerk verification errors
      if (error.message?.includes('expired')) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Token has expired!');
      }
      if (error.message?.includes('invalid')) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token!');
      }
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }
  });
};

export default auth;
