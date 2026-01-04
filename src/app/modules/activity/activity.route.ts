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
