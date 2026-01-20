import express from 'express';
import { ScheduleController } from './schedule.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../../modules/user/user.constant';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLE.lawyer, USER_ROLE.admin),
  ScheduleController.createEvent
);

router.get(
  '/today',
  auth(USER_ROLE.lawyer, USER_ROLE.admin, USER_ROLE.client),
  ScheduleController.getTodaySchedule
);

router.get(
  '/',
  auth(USER_ROLE.lawyer, USER_ROLE.admin, USER_ROLE.client),
  ScheduleController.getAllEvents
);

router.get(
  '/:id',
  auth(USER_ROLE.lawyer, USER_ROLE.admin, USER_ROLE.client),
  ScheduleController.getEventById
);

router.patch(
  '/:id',
  auth(USER_ROLE.lawyer, USER_ROLE.admin),
  ScheduleController.updateEvent
);

router.delete(
  '/:id',
  auth(USER_ROLE.lawyer, USER_ROLE.admin),
  ScheduleController.deleteEvent
);

export const ScheduleRoutes = router;
