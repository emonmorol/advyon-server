import express from 'express';
import auth from '../../middlewares/auth';
import { ActivityController } from './activity.controller';

const router = express.Router();

router.get('/', auth('admin', 'superAdmin', 'lawyer'), ActivityController.getAllActivities);
router.get('/:caseId', auth('admin', 'superAdmin', 'lawyer', 'client'), ActivityController.getCaseActivities);

export const ActivityRoutes = router;
