import express from 'express';
import auth from '../../middlewares/auth';
import { NotificationController } from './notification.controller';

const router = express.Router();

router.get('/', auth('admin', 'superAdmin', 'lawyer', 'client'), NotificationController.getMyNotifications);
router.get('/summary', auth('admin', 'superAdmin', 'lawyer', 'client'), NotificationController.getNotificationSummary);
router.patch('/:id/read', auth('admin', 'superAdmin', 'lawyer', 'client'), NotificationController.markAsRead);

export const NotificationRoutes = router;
