import express from 'express';
import { AIControllers } from './ai.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI Assistant and Document Analysis
 */

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: Chat with AI
 *     description: Sends a message to the AI assistant and gets a response.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               context:
 *                 type: object
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/chat', auth(), AIControllers.chat);

/**
 * @swagger
 * /ai/documents/analyze:
 *   post:
 *     summary: Analyze document
 *     description: Triggers AI analysis of a document content.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentId
 *             properties:
 *               documentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Analysis result
 */
router.post('/documents/analyze', auth(), AIControllers.analyzeDocument);

export const AIRoutes = router;
