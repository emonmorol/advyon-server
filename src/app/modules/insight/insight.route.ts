import express from 'express';
import auth from '../../middlewares/auth';
import { InsightController } from './insight.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Insights
 *   description: AI-generated insights
 */

/**
 * @swagger
 * /ai-insights/recent:
 *   get:
 *     summary: Get recent insights
 *     description: Retrieves a list of recent AI insights.
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of insights
 */
router.get('/recent', auth('admin', 'superAdmin', 'lawyer'), InsightController.getRecentInsights);

export const InsightRoutes = router;
