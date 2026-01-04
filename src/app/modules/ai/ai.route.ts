import express from 'express';
import { AIControllers } from './ai.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/chat', auth(), AIControllers.chat);
router.post('/documents/analyze', auth(), AIControllers.analyzeDocument);

export const AIRoutes = router;
