import { NextFunction, Request, Response } from 'express';
import { wageService } from '../services/wage.service';
import {
  MarkWagesPaidRequestSchema,
  MarkWagesUnpaidRequestSchema,
  PayWorkLogRequestSchema,
  RecentPaidQuerySchema,
  SiteOnlyQuerySchema,
  UnpayWorkLogRequestSchema,
  WagePaysheetQuerySchema,
  WageSummaryQuerySchema,
} from '../schema/wage/wage.request.schema';
import {
  PaginatedRecentWagePaymentListResponseSchema,
  PayWorkLogResponseSchema,
  WageSummaryListResponseSchema,
  WorkLogPayableListResponseSchema,
} from '../schema/wage/wage.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { HttpError } from '../utils/httpError';
import { assertSiteAccess } from '../utils/siteAccess';
import { buildWagePaysheetPdf } from '../reports/wagePaysheet';

export async function getWageSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(WageSummaryQuerySchema, req.query);
    const rows = await wageService.getSummary(query.site, query.from, query.to);
    const output = validateResponse(WageSummaryListResponseSchema, rows);
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function getWorkLogPayables(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(SiteOnlyQuerySchema, req.query);
    const rows = await wageService.getWorkLogPayables(query.site);
    const output = validateResponse(WorkLogPayableListResponseSchema, rows);
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function getRecentWagePayments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(RecentPaidQuerySchema, req.query);
    const result = await wageService.getRecentPayments(query.site, query.page, query.limit, query.from, query.to);
    const output = validateResponse(PaginatedRecentWagePaymentListResponseSchema, result);
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function exportWagePaysheet(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(WagePaysheetQuerySchema, req.query);
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const data = await wageService.getPaysheetData(query.site, query.from, query.to, req.user.id, query.contractor);
    const buffer = await buildWagePaysheetPdf(data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="paysheet-${query.from}-to-${query.to}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

export async function markWagesPaid(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateRequest(MarkWagesPaidRequestSchema, req.body);
    await wageService.markPaid(input);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function markWagesUnpaid(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateRequest(MarkWagesUnpaidRequestSchema, req.body);
    await wageService.markUnpaid(input);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function payWorkLog(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateRequest(PayWorkLogRequestSchema, req.body);
    await assertSiteAccess(req.user, input.site);
    const result = await wageService.payWorkLog(input);
    const output = validateResponse(PayWorkLogResponseSchema, result);
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function unpayWorkLog(req: Request, res: Response, next: NextFunction) {
  try {
    const input = validateRequest(UnpayWorkLogRequestSchema, req.body);
    await assertSiteAccess(req.user, input.site);
    await wageService.unpayWorkLog(input);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
