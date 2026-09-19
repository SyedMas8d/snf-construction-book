import { NextFunction, Request, Response } from 'express';
import { workLogService } from '../services/workLog.service';
import {
  CreateWorkLogRequestSchema,
  ListWorkLogsQuerySchema,
  UpdateWorkLogRequestSchema,
  WorkLogOverlapsQuerySchema,
} from '../schema/workLog/workLog.request.schema';
import {
  PaginatedWorkLogListResponseSchema,
  WorkLogOverlapsResponseSchema,
  WorkLogResponseSchema,
} from '../schema/workLog/workLog.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { objectIdSchema } from '../utils/objectId.schema';
import { assertSiteAccess, resolveSiteFilter } from '../utils/siteAccess';
import { HttpError } from '../utils/httpError';

export async function createWorkLog(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const input = validateRequest(CreateWorkLogRequestSchema, req.body);
    await assertSiteAccess(req.user, input.site);
    const workLog = await workLogService.createWorkLog(input, req.user.id);
    res.status(201).json({ _id: workLog._id.toString() });
  } catch (err) {
    next(err);
  }
}

export async function listWorkLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(ListWorkLogsQuerySchema, req.query);
    const site = await resolveSiteFilter(req.user, query.site);
    const result = await workLogService.listWorkLogs(
      { site, contractor: query.contractor, bucket: query.bucket, from: query.from, to: query.to },
      query.page,
      query.limit
    );
    const output = validateResponse(PaginatedWorkLogListResponseSchema, result);
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function getWorkLogOverlaps(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(WorkLogOverlapsQuerySchema, req.query);
    await assertSiteAccess(req.user, query.site);
    const rows = await workLogService.getOverlaps(query.site, query.contractors, query.from, query.to);
    const output = validateResponse(WorkLogOverlapsResponseSchema, rows);
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function getWorkLog(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const existing = await workLogService.getWorkLog(id);
    await assertSiteAccess(req.user, existing.site.toString());
    const detail = await workLogService.getWorkLogDetail(id);
    const output = validateResponse(WorkLogResponseSchema, detail);
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function updateWorkLog(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const existing = await workLogService.getWorkLog(id);
    await assertSiteAccess(req.user, existing.site.toString());
    const input = validateRequest(UpdateWorkLogRequestSchema, req.body);
    await workLogService.updateWorkLog(id, input);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkLog(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const existing = await workLogService.getWorkLog(id);
    await assertSiteAccess(req.user, existing.site.toString());
    await workLogService.deleteWorkLog(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
