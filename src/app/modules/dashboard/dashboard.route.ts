import express from 'express';
import auth from '../../middlewares/auth';
import { DashboardControllers } from './dashboard.controller';

const router = express.Router();

router.get(
  '/stats',
  auth(),
  DashboardControllers.getDashboardStats,
);

export const DashboardRoutes = router;
