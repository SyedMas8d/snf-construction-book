import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { requireSignupKey } from '../middleware/requireSignupKey';
import {
  changePassword,
  createAdmin,
  createEngineer,
  deleteEngineer,
  listAdmins,
  listEngineers,
  login,
  me,
  resetAdminPassword,
  resetEngineerPassword,
  signup,
  updateEngineerSites,
} from '../handlers/auth.handler';

export const authRouter = Router();

// No signup UI in the app — this is only ever called directly, with the x-api-key
// header matching the secret stored (hashed) in the SignupKey collection. Creates a
// super_admin account, which then onboards admins through the routes below.
authRouter.post('/signup', requireSignupKey, signup);
authRouter.post('/login', login);
authRouter.get('/me', requireAuth, me);
authRouter.patch('/me/password', requireAuth, changePassword);
authRouter.get('/admins', requireAuth, requireRole('super_admin'), listAdmins);
authRouter.post('/admins', requireAuth, requireRole('super_admin'), createAdmin);
authRouter.patch('/admins/:id/reset-password', requireAuth, requireRole('super_admin'), resetAdminPassword);
authRouter.get('/engineers', requireAuth, requireRole('admin'), listEngineers);
authRouter.post('/engineers', requireAuth, requireRole('admin'), createEngineer);
authRouter.delete('/engineers/:id', requireAuth, requireRole('admin'), deleteEngineer);
authRouter.patch('/engineers/:id/sites', requireAuth, requireRole('admin'), updateEngineerSites);
authRouter.patch('/engineers/:id/reset-password', requireAuth, requireRole('admin'), resetEngineerPassword);
