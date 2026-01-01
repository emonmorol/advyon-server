import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { DocumentControllers } from './document.controller';
import { DocumentValidation } from './document.validation';
import { uploadDocument } from '../../config/document-upload.config';

const router = express.Router();

/**
 * POST /documents/:caseId/upload
 * Upload a document to a case with AI analysis
 * Requires authentication and file upload
 */
router.post(
  '/:caseId/upload',
  auth(),
  uploadDocument.single('file'),
  validateRequest(DocumentValidation.uploadDocumentValidation),
  DocumentControllers.uploadDocument,
);

/**
 * POST /documents/:caseId/upload-legacy
 * Legacy upload without AI analysis
 */
router.post(
  '/:caseId/upload-legacy',
  auth(),
  uploadDocument.single('file'),
  validateRequest(DocumentValidation.uploadDocumentValidation),
  DocumentControllers.uploadDocumentLegacy,
);

/**
 * GET /documents/:caseId
 * Get all documents for a case
 * Requires authentication
 */
router.get(
  '/:caseId',
  auth(),
  validateRequest(DocumentValidation.queryDocumentValidation),
  DocumentControllers.getDocuments,
);

/**
 * GET /documents/:caseId/:documentId
 * Get a single document by ID
 * Requires authentication
 */
router.get('/:caseId/:documentId', auth(), DocumentControllers.getDocument);

/**
 * GET /documents/:caseId/:documentId/status
 * Get document processing status (for polling)
 * Requires authentication
 */
router.get(
  '/:caseId/:documentId/status',
  auth(),
  DocumentControllers.getDocumentStatus,
);

/**
 * POST /documents/:caseId/:documentId/reanalyze
 * Re-trigger AI analysis for a document
 * Requires authentication
 */
router.post(
  '/:caseId/:documentId/reanalyze',
  auth(),
  DocumentControllers.reanalyzeDocument,
);

/**
 * DELETE /documents/:caseId/:documentId
 * Delete a document
 * Requires authentication
 */
router.delete('/:caseId/:documentId', auth(), DocumentControllers.deleteDocument);
router.get('/:caseId/:documentId/download', auth('admin', 'superAdmin', 'lawyer', 'client'), DocumentControllers.downloadDocument);

export const DocumentRoutes = router;
