/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserControllers } from './user.controller';
import { UserValidation } from './user.validation';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users/create-user:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user in the system.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created successfully
 */
router.post(
  '/create-user',
  validateRequest(UserValidation.createUserValidationSchema),
  UserControllers.createUser,
);

/**
 * @swagger
 * /users/me/profile:
 *   get:
 *     summary: Get my profile
 *     description: Retrieves the profile of the logged-in user.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get(
  '/me/profile',
  auth(),
  UserControllers.getMyProfile,
);

/**
 * @swagger
 * /users/my-clients:
 *   get:
 *     summary: Get my clients (Lawyer only)
 *     description: Retrieves a list of clients associated with the logged-in lawyer's cases.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Clients retrieved successfully
 */
router.get(
  '/my-clients',
  auth('lawyer'),
  UserControllers.getLawyerClients,
);

/**
 * @swagger
 * /users/me/profile:
 *   patch:
 *     summary: Update my profile
 *     description: Updates the profile of the logged-in user. Email cannot be changed.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               displayName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               bio:
 *                 type: string
 *               timezone:
 *                 type: string
 *               preferredLanguage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch(
  '/me/profile',
  auth(),
  UserControllers.updateMyProfile,
);

/**
 * @swagger
 * /users/me/change-password:
 *   post:
 *     summary: Change password
 *     description: Changes the password of the logged-in user.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 */
router.post(
  '/me/change-password',
  auth(),
  UserControllers.changePassword,
);

/**
 * @swagger
 * /users/me/preferences:
 *   get:
 *     summary: Get my preferences
 *     description: Retrieves user preferences (theme, notifications, dashboard config)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 */
router.get(
  '/me/preferences',
  auth(),
  UserControllers.getMyPreferences,
);

/**
 * @swagger
 * /users/me/preferences:
 *   patch:
 *     summary: Update my preferences
 *     description: Updates user preferences (theme, notifications, dashboard config)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *               notifications:
 *                 type: object
 *               dashboardConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
router.patch(
  '/me/preferences',
  auth(),
  UserControllers.updateMyPreferences,
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a list of all users.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 */
router.get(
  '/',
  UserControllers.getAllUsers,
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     description: Retrieves a single user's details by their ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get(
  '/:id',
  UserControllers.getSingleUser,
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user
 *     description: Updates a user's details by their ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.patch(
  '/:id',
  validateRequest(UserValidation.updateUserValidationSchema),
  UserControllers.updateUser,
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user from the system by their ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete(
  '/:id',
  UserControllers.deleteUser,
);

export const UserRoutes = router;
