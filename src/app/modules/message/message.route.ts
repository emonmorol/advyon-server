import express from 'express';
import auth from '../../middlewares/auth';
import { MessageControllers } from './message.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Client messages/requests management
 */

/**
 * @swagger
 * /messages:
 *   get:
 *     summary: Get my messages
 *     description: Retrieves messages for the logged-in user with pagination
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [unread, read, replied, archived]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get(
  '/',
  auth(),
  MessageControllers.getMyMessages,
);

/**
 * @swagger
 * /messages/pending-count:
 *   get:
 *     summary: Get pending messages count
 *     description: Returns count of unread messages
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: Count retrieved successfully
 */
router.get(
  '/pending-count',
  auth(),
  MessageControllers.getPendingCount,
);

/**
 * @swagger
 * /messages/{id}:
 *   get:
 *     summary: Get a single message
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message retrieved successfully
 */
router.get(
  '/:id',
  auth(),
  MessageControllers.getMessage,
);

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a new message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - subject
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *               caseId:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post(
  '/',
  auth(),
  MessageControllers.createMessage,
);

/**
 * @swagger
 * /messages/{id}/read:
 *   patch:
 *     summary: Mark message as read
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as read
 */
router.patch(
  '/:id/read',
  auth(),
  MessageControllers.markAsRead,
);

/**
 * @swagger
 * /messages/{id}/archive:
 *   patch:
 *     summary: Archive a message
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message archived successfully
 */
router.patch(
  '/:id/archive',
  auth(),
  MessageControllers.archiveMessage,
);

export const MessageRoutes = router;
