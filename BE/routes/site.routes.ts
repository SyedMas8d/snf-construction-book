import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { createSite, deleteSite, getSite, listSites, updateSite } from '../handlers/site.handler';
import {
  createCustomerPayment,
  deleteCustomerPayment,
  listCustomerPayments,
} from '../handlers/customerPayment.handler';

export const siteRouter = Router();

siteRouter.use(requireAuth);

siteRouter.get('/', listSites);
siteRouter.get('/:id', getSite);
siteRouter.post('/', requireRole('admin'), createSite);
siteRouter.put('/:id', requireRole('admin'), updateSite);
siteRouter.delete('/:id', requireRole('admin'), deleteSite);

// Customer payments received against a site — admin only, same as site management itself.
siteRouter.get('/:siteId/payments', requireRole('admin'), listCustomerPayments);
siteRouter.post('/:siteId/payments', requireRole('admin'), createCustomerPayment);
siteRouter.delete('/:siteId/payments/:id', requireRole('admin'), deleteCustomerPayment);
