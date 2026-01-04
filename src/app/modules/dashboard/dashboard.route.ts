import express from 'express';
import { DashboardControllers } from './dashboard.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard stats
 *     description: Retrieves analytical statistics for the dashboard.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/stats', auth(), DashboardControllers.getStats);

export const DashboardRoutes = router;
