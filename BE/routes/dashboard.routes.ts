import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getDashboardSummary } from '../handlers/dashboard.handler';
import { exportDashboardSummary } from '../handlers/dashboardExport.handler';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/', getDashboardSummary);
dashboardRouter.get('/export', exportDashboardSummary);
