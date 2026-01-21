import express from 'express';
import auth from '../../middlewares/auth';
import { CaseAccessController } from './caseAccess.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: CaseAccess
 *   description: Manage access to cases
 */

/**
 * @swagger
 * /case-access/share:
 *   post:
 *     summary: Share a case
 *     description: Grants a user access to a specific case.
 *     tags: [CaseAccess]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseId
 *               - email
 *             properties:
 *               caseId:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Case shared successfully
 */
router.post('/share', auth('admin', 'superAdmin', 'lawyer'), CaseAccessController.shareCase);

/**
 * @swagger
 * /case-access/{caseId}/users:
 *   get:
 *     summary: Get shared users
 *     description: Retrieves a list of users who have access to the case.
 *     tags: [CaseAccess]
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
 *         description: List of users with access
 */
router.get('/:caseId/users', auth('admin', 'superAdmin', 'lawyer'), CaseAccessController.getCaseSharedUsers);

/**
 * @swagger
 * /case-access/{caseId}/{userId}:
 *   delete:
 *     summary: Revoke access
 *     description: Revokes a user's access to a case.
 *     tags: [CaseAccess]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Access revoked successfully
 */
router.delete('/:caseId/:userId', auth('admin', 'superAdmin', 'lawyer'), CaseAccessController.revokeCaseAccess);

export const CaseAccessRoutes = router;
