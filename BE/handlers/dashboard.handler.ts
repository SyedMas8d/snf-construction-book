import { NextFunction, Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { DashboardQuerySchema } from '../schema/dashboard/dashboard.request.schema';
import { DashboardResponseSchema } from '../schema/dashboard/dashboard.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { assertSiteAccess } from '../utils/siteAccess';

export async function getDashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(DashboardQuerySchema, req.query);
    await assertSiteAccess(req.user, query.site);
    const summary = await dashboardService.getSummary(query.site, query.from, query.to);
    const output = validateResponse(DashboardResponseSchema, summary);
    res.json(output);
  } catch (err) {
    next(err);
  }
}
