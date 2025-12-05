import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { CaseControllers } from './case.controller';
import { CaseValidation } from './case.validation';

const router = express.Router();

/**
 * POST /cases
 * Create a new case
 * Requires authentication
 */
router.post(
  '/',
  auth(),
  validateRequest(CaseValidation.createCaseValidation),
  CaseControllers.createCase,
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
 * GET /cases/:caseId
 * Get a single case by ID
 * Requires authentication
 */
router.get('/:caseId', auth(), CaseControllers.getCaseById);

/**
 * PUT /cases/:caseId
 * Update a case
 * Requires authentication
 */
router.put(
  '/:caseId',
  auth(),
  validateRequest(CaseValidation.updateCaseValidation),
  CaseControllers.updateCase,
);

/**
 * DELETE /cases/:caseId
 * Delete a case (soft delete)
 * Requires authentication
 */
router.delete('/:caseId', auth(), CaseControllers.deleteCase);

export const CaseRoutes = router;
