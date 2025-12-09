import { Router } from 'express';

import { AuthRoutes } from '../modules/auth/auth.route';
import { UserRoutes } from '../modules/user/user.route';
import { CaseRoutes } from '../modules/case/case.route';
import { DocumentRoutes } from '../modules/document/document.route';

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
