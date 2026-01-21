import express from 'express';
import { CommunityControllers } from './community.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Community
 *   description: Community threads and discussions
 */

/**
 * @swagger
 * /community/threads:
 *   get:
 *     summary: Get community threads
 *     description: Retrieves a list of community threads.
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of threads
 */
router.get('/threads', auth(), CommunityControllers.getThreads);

export const CommunityRoutes = router;
