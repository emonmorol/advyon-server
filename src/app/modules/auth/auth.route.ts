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
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and User Onboarding
 */

/**
 * @swagger
 * /auth/sync:
 *   post:
 *     summary: Sync user from Clerk
 *     description: Syncs a user from Clerk to the local database. Used on first login.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User synced successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/sync',
  auth(), // Clerk JWT verification
  AuthControllers.syncUser,
);

/**
 * @swagger
 * /auth/onboard:
 *   post:
 *     summary: Complete user onboarding
 *     description: Completes the user onboarding process by setting the user role.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [LAWYER, UPLOAD_CLIENT, CLIENT]
 *                 description: The role of the user
 *     responses:
 *       200:
 *         description: User onboarded successfully
 *       400:
 *         description: Invalid role or request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/onboard',
  auth(), // Clerk JWT verification
  validateRequest(AuthValidation.onboardValidation),
  AuthControllers.onboardUser,
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieves the profile of the currently authenticated user.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/me',
  auth(), // Clerk JWT verification
  AuthControllers.getCurrentUser,
);

/**
 * @swagger
 * /auth/me:
 *   patch:
 *     summary: Update current user profile
 *     description: Updates the profile of the currently authenticated user.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/me',
  auth(), // Clerk JWT verification
  validateRequest(AuthValidation.updateProfileValidation),
  AuthControllers.updateProfile,
);

export const AuthRoutes = router;
