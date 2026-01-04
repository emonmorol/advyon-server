import express from 'express';
import { DashboardControllers } from './dashboard.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.get('/stats', auth(), DashboardControllers.getStats);

export const DashboardRoutes = router;
