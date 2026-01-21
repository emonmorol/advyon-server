import express from 'express';
import auth from '../../middlewares/auth';
import { NotificationController } from './notification.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get my notifications
 *     description: Retrieves a list of notifications for the current user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', auth('admin', 'superAdmin', 'lawyer', 'client'), NotificationController.getMyNotifications);

/**
 * @swagger
 * /notifications/summary:
 *   get:
 *     summary: Get notification summary
 *     description: Retrieves a summary of notifications (e.g., unread count).
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification summary
 */
router.get('/summary', auth('admin', 'superAdmin', 'lawyer', 'client'), NotificationController.getNotificationSummary);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Marks a specific notification as read.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:id/read', auth('admin', 'superAdmin', 'lawyer', 'client'), NotificationController.markAsRead);

export const NotificationRoutes = router;
