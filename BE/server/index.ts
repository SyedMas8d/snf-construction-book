import express from 'express';
import cors from 'cors';
import { ensureDbConnected } from '../middleware/dbConnect';
import { errorHandler } from '../middleware/errorHandler';
import { authRouter } from '../routes/auth.routes';
import { siteRouter } from '../routes/site.routes';
import { dailyLogRouter } from '../routes/dailyLog.routes';
import { workLogRouter } from '../routes/workLog.routes';
import { wageRouter } from '../routes/wage.routes';
import { inventoryRouter } from '../routes/inventory.routes';
import { dashboardRouter } from '../routes/dashboard.routes';
import { contractorRouter } from '../routes/contractor.routes';
import { enterpriseSettingsRouter } from '../routes/enterpriseSettings.routes';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'construction-inventory-be',
    timestamp: new Date().toISOString(),
  });
});

app.use(ensureDbConnected);

app.use('/auth', authRouter);
app.use('/sites', siteRouter);
app.use('/contractors', contractorRouter);
app.use('/daily-logs', dailyLogRouter);
app.use('/work-logs', workLogRouter);
app.use('/wages', wageRouter);
app.use('/inventory', inventoryRouter);
app.use('/dashboard', dashboardRouter);
app.use('/enterprise', enterpriseSettingsRouter);

app.use(errorHandler);
