import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { createSite, deleteSite, getSite, listSites, updateSite } from '../handlers/site.handler';

export const siteRouter = Router();

siteRouter.use(requireAuth);

siteRouter.get('/', listSites);
siteRouter.get('/:id', getSite);
siteRouter.post('/', requireRole('admin'), createSite);
siteRouter.put('/:id', requireRole('admin'), updateSite);
siteRouter.delete('/:id', requireRole('admin'), deleteSite);
