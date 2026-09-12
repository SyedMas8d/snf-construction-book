import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  exportWagePaysheet,
  getRecentWagePayments,
  getWageSummary,
  getWorkLogPayables,
  markWagesPaid,
  markWagesUnpaid,
} from '../handlers/wage.handler';

export const wageRouter = Router();

wageRouter.use(requireAuth);
wageRouter.use(requireRole('admin'));

wageRouter.get('/summary', getWageSummary);
wageRouter.get('/work-log-payables', getWorkLogPayables);
wageRouter.get('/recent-paid', getRecentWagePayments);
wageRouter.get('/paysheet-export', exportWagePaysheet);
wageRouter.patch('/mark-paid', markWagesPaid);
wageRouter.patch('/mark-unpaid', markWagesUnpaid);
