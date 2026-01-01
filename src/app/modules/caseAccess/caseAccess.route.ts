import express from 'express';
import auth from '../../middlewares/auth';
import { CaseAccessController } from './caseAccess.controller';

const router = express.Router();

router.post('/share', auth('admin', 'superAdmin', 'lawyer'), CaseAccessController.shareCase);
router.get('/:caseId/users', auth('admin', 'superAdmin', 'lawyer'), CaseAccessController.getCaseSharedUsers);
router.delete('/:caseId/:userId', auth('admin', 'superAdmin', 'lawyer'), CaseAccessController.revokeCaseAccess);

export const CaseAccessRoutes = router;
