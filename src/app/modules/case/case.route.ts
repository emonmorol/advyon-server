import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { CaseControllers } from './case.controller';
import { CaseValidation } from './case.validation';
import { DocumentControllers } from '../document/document.controller';
import { DocumentValidation } from '../document/document.validation';
import { uploadDocument } from '../../config/document-upload.config';

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
 * POST /cases/:caseId/documents
 * Upload a document to a specific case
 * Requires authentication and file upload
 */
router.post(
  '/:caseId/documents',
  auth(),
  uploadDocument.single('file'),
  validateRequest(DocumentValidation.uploadDocumentValidation),
  DocumentControllers.uploadDocument,
);

/**
 * GET /cases/:caseId/documents/:documentId/status
 * Check document processing status
 */
router.get(
  '/:caseId/documents/:documentId/status',
  auth(),
  DocumentControllers.getDocumentStatus,
);

/**
 * GET /cases
 * Get all cases with optional filters
 * Requires authentication
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

// =========================================================================
// Document Routes for Case
// =========================================================================

/**
 * @swagger
 * /cases/{caseId}/documents:
 *   post:
 *     summary: Upload a document to a case
 *     tags: [Cases, Documents]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               folder: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Document uploaded successfully }
 */
router.post(
  '/:caseId/documents',
  auth(),
  uploadDocument.single('file'),
  validateRequest(DocumentValidation.uploadDocumentValidation),
  DocumentControllers.uploadDocument,
);

/**
 * @swagger
 * /cases/{caseId}/documents:
 *   get:
 *     summary: List all documents for a case
 *     tags: [Cases, Documents]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: folder
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of documents }
 */
router.get(
  '/:caseId/documents',
  auth(),
  validateRequest(DocumentValidation.queryDocumentValidation),
  DocumentControllers.getDocuments,
);

/**
 * @swagger
 * /cases/{caseId}/documents/{documentId}/status:
 *   get:
 *     summary: Get document AI analysis status
 *     tags: [Cases, Documents]
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Document status }
 */
router.get(
  '/:caseId/documents/:documentId/status',
  auth(),
  DocumentControllers.getDocumentStatus,
);

export const CaseRoutes = router;
