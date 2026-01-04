import { Router } from 'express';

import { AuthRoutes } from '../modules/auth/auth.route';
import { UserRoutes } from '../modules/user/user.route';
import { CaseRoutes } from '../modules/case/case.route';
import { DocumentRoutes } from '../modules/document/document.route';
import { ActivityRoutes } from '../modules/activity/activity.route';
import { InsightRoutes } from '../modules/insight/insight.route';
import { NotificationRoutes } from '../modules/notification/notification.route';
import { CaseAccessRoutes } from '../modules/caseAccess/caseAccess.route';
import { MetadataRoutes } from '../modules/metadata/metadata.route';
import { AdminRoutes } from '../modules/admin/admin.route';
import { AIRoutes } from '../modules/ai/ai.route';
import { DashboardRoutes } from '../modules/dashboard/dashboard.route';
import { CommunityRoutes } from '../modules/community/community.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/cases',
    route: CaseRoutes,
  },
  {
    path: '/documents',
    route: DocumentRoutes,
  },
  {
    path: '/activities',
    route: ActivityRoutes,
  },
  {
    path: '/ai-insights',
    route: InsightRoutes,
  },
  {
    path: '/notifications',
    route: NotificationRoutes,
  },
  {
    path: '/case-access',
    route: CaseAccessRoutes,
  },
  {
    path: '/metadata',
    route: MetadataRoutes,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },
  {
    path: '/ai',
    route: AIRoutes,
  },
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
  {
    path: '/community',
    route: CommunityRoutes,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
