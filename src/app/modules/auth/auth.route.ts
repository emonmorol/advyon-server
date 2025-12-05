import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthControllers } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = express.Router();

/**
 * POST /auth/sync
 * Sync user from Clerk (first login)
 * Requires Clerk JWT authentication
 */
router.post(
  '/sync',
  auth(), // Clerk JWT verification
  AuthControllers.syncUser,
);

/**
 * POST /auth/onboard
 * Complete user onboarding with role selection
 * Requires Clerk JWT authentication
 */
router.post(
  '/onboard',
  auth(), // Clerk JWT verification
  validateRequest(AuthValidation.onboardValidation),
  AuthControllers.onboardUser,
);

/**
 * GET /auth/me
 * Get current user with profile
 * Requires Clerk JWT authentication
 */
router.get(
  '/me',
  auth(), // Clerk JWT verification
  AuthControllers.getCurrentUser,
);

/**
 * PATCH /auth/me
 * Update current user profile
 * Requires Clerk JWT authentication
 */
router.patch(
  '/me',
  auth(), // Clerk JWT verification
  validateRequest(AuthValidation.updateProfileValidation),
  AuthControllers.updateProfile,
);

export const AuthRoutes = router;
