import express from 'express';
import { CommunityControllers } from './community.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.get('/threads', auth(), CommunityControllers.getThreads);

export const CommunityRoutes = router;
