import express from 'express';
import { CommunityController } from './community.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/threads', auth('client', 'lawyer', 'admin'), CommunityController.createThread);
router.get('/threads', CommunityController.getAllThreads);
router.get('/threads/:id', CommunityController.getThreadById);
router.post('/threads/:threadId/reply', auth('client', 'lawyer', 'admin'), CommunityController.addReply);
router.patch('/threads/:id/vote', auth('client', 'lawyer', 'admin'), CommunityController.voteThread);

export const CommunityRoutes = router;
