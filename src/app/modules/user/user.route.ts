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
  '/me/profile',
  auth(),
  UserControllers.getMyProfile,
);

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
