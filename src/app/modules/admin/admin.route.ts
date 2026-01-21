// src/app/modules/user/admin/admin.route.ts
import express from 'express';
import { AdminController } from './admin.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

import {
  getUsersQuerySchema,
  getUserParamsSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  deleteUserParamsSchema,
} from './admin.validation';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin user management
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin)
 *     description: Retrieves all users with pagination and filtering.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role
 *     responses:
 *       200:
 *         description: List of users
 */
router.get(
  '/users',
  auth('admin', 'superAdmin'),
  validateRequest(getUsersQuerySchema),
  AdminController.getAllUsers,
);

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get a single user (Admin)
 *     description: Retrieves details of a specific user.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get(
  '/users/:id',
  auth('admin', 'superAdmin'),
  validateRequest(getUserParamsSchema),
  AdminController.getSingleUser,
);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     description: Updates the role of a user.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 enum: [admin, lawyer, client]
 *     responses:
 *       200:
 *         description: User role updated
 */
router.patch(
  '/users/:id/role',
  auth('superAdmin'),
  validateRequest(updateUserRoleSchema),
  AdminController.updateUserRole,
);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     description: Updates the status of a user (e.g., active, suspended).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, blocked]
 *     responses:
 *       200:
 *         description: User status updated
 */
router.patch(
  '/users/:id/status',
  auth('admin', 'superAdmin'),
  validateRequest(updateUserStatusSchema),
  AdminController.updateUserStatus,
);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Soft delete user
 *     description: Soft deletes a user account.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User soft deleted
 */
router.delete(
  '/users/:id',
  auth('superAdmin'),
  validateRequest(deleteUserParamsSchema),
  AdminController.softDeleteUser,
);

export const AdminRoutes = router;
