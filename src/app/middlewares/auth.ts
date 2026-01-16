import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { verifyToken } from '@clerk/clerk-sdk-node';
import config from '../config';
import AppError from '../errors/appError';
import { TUserRole } from '../modules/user/user.interface';
import { User } from '../modules/user/user.model';
import catchAsync from '../utils/catchAsync';
import { AuthServices } from '../modules/auth/auth.service';

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // console.log('authHeader',authHeader);
    
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
      
      // Robust email extraction to prevent crashes
      let email = decoded.email as string;
      
      // Fallback: Check if email is inside specific Clerk structure (unlikely in standard JWT but good safety)
      // or if decoded.email is null/undefined
      if (!email && (decoded as any).email_addresses && Array.isArray((decoded as any).email_addresses)) {
         email = (decoded as any).email_addresses[0]?.email_address;
      }

      // Final Fallback: If absolutely no email found, do NOT pass undefined.
      // Pass null so service can handle it by generating a placeholder.
      if (!email) {
          email = null as any; 
      }
      
      // Find user in database by Clerk ID
      let user = await User.findOne({ clerkUserId });

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

        // Auto-sync user from Clerk if not found locally
        await AuthServices.syncUserFromClerk(clerkUserId, email);
        user = await User.findOne({ clerkUserId });

        if (!user) {
          throw new AppError(httpStatus.NOT_FOUND, 'This user is not found!');
        }
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
      // console.log('requiredRoles.length',requiredRoles.length);
      // console.log('user',user);
      
      if (
        requiredRoles.length > 0 &&
        !requiredRoles.includes(user.role as TUserRole)
      ) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'You are not authorized to access this resource!',
        );
      }

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
