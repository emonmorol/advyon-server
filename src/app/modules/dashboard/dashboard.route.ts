import express from 'express';
import auth from '../../middlewares/auth';
import { DashboardControllers } from './dashboard.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard endpoints
 */

/**
 * @swagger
 * /dashboard/unified:
 *   get:
 *     summary: Get unified dashboard data
 *     description: Retrieves all dashboard data in a single call - stats, recent cases, messages, activities, etc.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unified dashboard data
 */
router.get(
  '/unified',
  auth(),
  DashboardControllers.getUnifiedDashboard,
);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard stats (legacy)
 *     description: Retrieves basic dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get(
  '/stats',
  auth(),
  DashboardControllers.getDashboardStats,
);

export const DashboardRoutes = router;

