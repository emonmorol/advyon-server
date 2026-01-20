import express from 'express';
import { AnalyticsController } from './analytics.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../../modules/user/user.constant';

const router = express.Router();

router.get(
  '/overview',
  auth(USER_ROLE.lawyer, USER_ROLE.admin),
  AnalyticsController.getAnalyticsOverview
);

export const AnalyticsRoutes = router;
