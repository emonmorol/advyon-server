import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { CaseControllers } from './case.controller';
import { CaseValidation } from './case.validation';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cases
 *   description: Case management
 */

/**
 * @swagger
 * /cases:
 *   post:
 *     summary: Create a new case
 *     description: Creates a new legal case.
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, CLOSED, ARCHIVED]
 *     responses:
 *       200:
 *         description: Case created successfully
 */
router.post(
  '/',
  auth(),
  validateRequest(CaseValidation.createCaseValidation),
  CaseControllers.createCase,
);

/**
 * @swagger
 * /cases:
 *   get:
 *     summary: Get all cases
 *     description: Retrieves a list of cases, optionally filtered.
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter cases by status
 *     responses:
 *       200:
 *         description: List of cases retrieved successfully
 */
router.get(
  '/',
  auth(),
  validateRequest(CaseValidation.queryCaseValidation),
  CaseControllers.getAllCases,
);

/**
 * @swagger
 * /cases/{caseId}:
 *   get:
 *     summary: Get a single case
 *     description: Retrieves a single case by its ID.
 *     tags: [Cases]
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
 *         description: Case details
 *       404:
 *         description: Case not found
 */
router.get('/:caseId', 
  auth(), 
  CaseControllers.getCaseById);

/**
 * @swagger
 * /cases/{caseId}:
 *   put:
 *     summary: Update a case
 *     description: Updates an existing case.
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Case updated successfully
 */
router.put(
  '/:caseId',
  auth(),
  validateRequest(CaseValidation.updateCaseValidation),
  CaseControllers.updateCase,
);

/**
 * @swagger
 * /cases/{caseId}:
 *   delete:
 *     summary: Delete a case
 *     description: Soft deletes a case.
 *     tags: [Cases]
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
 *         description: Case deleted successfully
 */
router.delete('/:caseId', 
  auth(),
   CaseControllers.deleteCase);

export const CaseRoutes = router;
