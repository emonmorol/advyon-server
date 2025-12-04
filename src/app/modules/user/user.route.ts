/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { UserControllers } from './user.controller';
import { UserValidation } from './user.validation';

const router = express.Router();

router.post(
  '/create-user',
  validateRequest(UserValidation.createUserValidationSchema),
  UserControllers.createUser,
);

router.get(
  '/',
  UserControllers.getAllUsers,
);

router.get(
  '/:id',
  UserControllers.getSingleUser,
);

router.patch(
  '/:id',
  validateRequest(UserValidation.updateUserValidationSchema),
  UserControllers.updateUser,
);

router.delete(
  '/:id',
  UserControllers.deleteUser,
);

export const UserRoutes = router;
