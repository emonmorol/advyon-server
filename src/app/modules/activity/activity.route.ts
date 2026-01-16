import express from 'express';
import auth from '../../middlewares/auth';
import { ActivityController } from './activity.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Activities
 *   description: User and Case activity logs
 */

/**
 * @swagger
 * /activities/me/recent:
 *   get:
 *     summary: Get my recent activities
 *     description: Retrieves recent activities for the logged-in user
 *     tags: [Activities]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recent activities retrieved
 */
router.get('/me/recent', auth(), ActivityController.getMyRecentActivities);

/**
 * @swagger
 * /activities/me/stats:
 *   get:
 *     summary: Get my activity stats
 *     description: Retrieves activity statistics for dashboard
 *     tags: [Activities]
 *     responses:
 *       200:
 *         description: Activity stats retrieved
 */
router.get('/me/stats', auth(), ActivityController.getMyStats);

/**
 * @swagger
 * /activities:
 *   get:
 *     summary: Get all activities
 *     description: Retrieves a list of system activities.
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of activities
 */
router.get('/', auth('admin', 'superAdmin', 'lawyer'), ActivityController.getAllActivities);

/**
 * @swagger
 * /activities/{caseId}:
 *   get:
 *     summary: Get case activities
 *     description: Retrieves activities related to a specific case.
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of case activities
 */
router.get('/:caseId', auth('admin', 'superAdmin', 'lawyer', 'client'), ActivityController.getCaseActivities);

export const ActivityRoutes = router;

