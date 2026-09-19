import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createWorkLog,
  deleteWorkLog,
  getWorkLog,
  getWorkLogOverlaps,
  listWorkLogs,
  updateWorkLog,
} from '../handlers/workLog.handler';

export const workLogRouter = Router();

workLogRouter.use(requireAuth);

workLogRouter.get('/', listWorkLogs);
// Must come before '/:id' — otherwise Express would match "overlaps" as a work log id.
workLogRouter.get('/overlaps', getWorkLogOverlaps);
workLogRouter.get('/:id', getWorkLog);
workLogRouter.post('/', createWorkLog);
workLogRouter.put('/:id', updateWorkLog);
workLogRouter.delete('/:id', deleteWorkLog);
