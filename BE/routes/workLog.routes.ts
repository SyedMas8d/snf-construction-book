import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createWorkLog,
  deleteWorkLog,
  getWorkLogOverlaps,
  listWorkLogs,
  updateWorkLog,
} from '../handlers/workLog.handler';

export const workLogRouter = Router();

workLogRouter.use(requireAuth);

workLogRouter.get('/', listWorkLogs);
workLogRouter.get('/overlaps', getWorkLogOverlaps);
workLogRouter.post('/', createWorkLog);
workLogRouter.put('/:id', updateWorkLog);
workLogRouter.delete('/:id', deleteWorkLog);
