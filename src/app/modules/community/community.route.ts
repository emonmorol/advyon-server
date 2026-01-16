import express from 'express';
import { CommunityController } from './community.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

// Stats endpoint (public)
router.get('/stats', CommunityController.getCommunityStats);

// Trending topics endpoint (public)
router.get('/trending-topics', CommunityController.getTrendingTopics);

// Thread routes
router.post('/threads', auth('client', 'lawyer', 'admin'), CommunityController.createThread);
router.get('/threads', CommunityController.getAllThreads);
router.get('/threads/:id', CommunityController.getThreadById);
router.post('/threads/:threadId/reply', auth('client', 'lawyer', 'admin'), CommunityController.addReply);
router.patch('/threads/:id/vote', auth('client', 'lawyer', 'admin'), CommunityController.voteThread);
router.patch('/threads/:id/solve', auth('client', 'lawyer', 'admin'), CommunityController.markAsSolved);

// Reply routes
router.patch('/replies/:replyId/vote', auth('client', 'lawyer', 'admin'), CommunityController.voteReply);

export const CommunityRoutes = router;
