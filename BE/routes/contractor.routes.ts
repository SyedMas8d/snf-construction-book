import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  createContractor,
  deleteContractor,
  getContractor,
  listContractors,
  updateContractor,
} from '../handlers/contractor.handler';

export const contractorRouter = Router();

contractorRouter.use(requireAuth);

contractorRouter.get('/', listContractors);
contractorRouter.get('/:id', getContractor);
contractorRouter.post('/', requireRole('admin'), createContractor);
contractorRouter.put('/:id', requireRole('admin'), updateContractor);
contractorRouter.delete('/:id', requireRole('admin'), deleteContractor);
