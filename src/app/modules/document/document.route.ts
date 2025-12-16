import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { DocumentControllers } from './document.controller';
import { DocumentValidation } from './document.validation';
import { uploadDocument } from '../../config/document-upload.config';

const router = express.Router();

/**
 * POST /cases/:caseId/documents/upload
 * Upload a document to a case
 * Requires authentication and file upload
 */
router.post(
  '/:caseId/upload',
  //auth(),
  uploadDocument.single('file'),
  validateRequest(DocumentValidation.uploadDocumentValidation),
  DocumentControllers.uploadDocument,
);

/**
 * GET /cases/:caseId/documents
 * Get all documents for a case
 * Requires authentication
 */
router.get(
  '/:caseId',
  //auth(),
  validateRequest(DocumentValidation.queryDocumentValidation),
  DocumentControllers.getDocuments,
);

/**
 * DELETE /cases/:caseId/documents/:documentId
 * Delete a document
 * Requires authentication
 */
router.delete('/:caseId/:documentId', 
  //auth(), 
  DocumentControllers.deleteDocument);

export const DocumentRoutes = router;
