import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createDailyLog,
  deleteDailyLog,
  getDailyLog,
  listDailyLogs,
  updateDailyLog,
} from '../handlers/dailyLog.handler';

export const dailyLogRouter = Router();

dailyLogRouter.use(requireAuth);

dailyLogRouter.get('/', listDailyLogs);
dailyLogRouter.get('/:id', getDailyLog);
dailyLogRouter.post('/', createDailyLog);
dailyLogRouter.put('/:id', updateDailyLog);
dailyLogRouter.delete('/:id', deleteDailyLog);
