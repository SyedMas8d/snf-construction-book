import { NextFunction, Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { DashboardExportQuerySchema } from '../schema/dashboard/dashboard.request.schema';
import { validateRequest } from '../utils/zodValidate';
import { buildDashboardWorkbook } from '../reports/dashboardWorkbook';
import { assertSiteAccess } from '../utils/siteAccess';

export async function exportDashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(DashboardExportQuerySchema, req.query);
    await assertSiteAccess(req.user, query.site);
    const data = await dashboardService.getExportData(query.site, query.from, query.to);
    const buffer = await buildDashboardWorkbook(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dashboard-${data.range.from}-to-${data.range.to}.xlsx"`
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
}
