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

// GET /admin/users
router.get(
  '/users',
  //auth('admin', 'superAdmin'),
  //validateRequest(getUsersQuerySchema),
  AdminController.getAllUsers,
);

// GET /admin/users/:id
router.get(
  '/users/:id',
  //auth('admin', 'superAdmin'),
  //validateRequest(getUserParamsSchema),
  AdminController.getSingleUser,
);

// PATCH /admin/users/:id/role
router.patch(
  '/users/:id/role',
  //auth('superAdmin'),
  /// validateRequest(updateUserRoleSchema),
  AdminController.updateUserRole,
);

// PATCH /admin/users/:id/status
router.patch(
  '/users/:id/status',
  //auth('admin', 'superAdmin'),
  validateRequest(updateUserStatusSchema),
  AdminController.updateUserStatus,
);

// DELETE /admin/users/:id (soft delete)
router.delete(
  '/users/:id',
  //auth('superAdmin'),
  validateRequest(deleteUserParamsSchema),
  AdminController.softDeleteUser,
);

export const AdminRoutes = router;
