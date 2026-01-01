import express from 'express';
import auth from '../../middlewares/auth';
import { InsightController } from './insight.controller';

const router = express.Router();

router.get('/recent', auth('admin', 'superAdmin', 'lawyer'), InsightController.getRecentInsights);

export const InsightRoutes = router;
