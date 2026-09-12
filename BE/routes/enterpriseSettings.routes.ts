import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { getEnterpriseSettings, updateEnterpriseSettings } from '../handlers/enterpriseSettings.handler';

export const enterpriseSettingsRouter = Router();

enterpriseSettingsRouter.use(requireAuth);
enterpriseSettingsRouter.use(requireRole('admin'));

enterpriseSettingsRouter.get('/', getEnterpriseSettings);
enterpriseSettingsRouter.put('/', updateEnterpriseSettings);
