import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { dailyLogService } from '../services/dailyLog.service';
import { CreateDailyLogRequestSchema, UpdateDailyLogRequestSchema } from '../schema/dailyLog/dailyLog.request.schema';
import { DailyLogListResponseSchema, DailyLogResponseSchema } from '../schema/dailyLog/dailyLog.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { objectIdSchema } from '../utils/objectId.schema';
import { dateOnlySchema } from '../utils/dateOnly.schema';
import { toPlain } from '../utils/toPlain';
import { assertSiteAccess, resolveSiteFilter } from '../utils/siteAccess';
import { workLogRepo } from '../repositories/workLog.repo';
import { workLogService } from '../services/workLog.service';
import { resolveCreatorNames } from '../utils/resolveCreatorNames';
import { assertOwnerOrAdmin } from '../utils/ownership';
import { HttpError } from '../utils/httpError';

const ListDailyLogsQuerySchema = z.object({
  site: objectIdSchema.optional(),
  contractor: objectIdSchema.optional(),
  workerType: z.string().trim().min(1).optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  workLog: objectIdSchema.optional(),
});

export async function createDailyLog(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const input = validateRequest(CreateDailyLogRequestSchema, req.body);
    await assertSiteAccess(req.user, input.site);

    const workLog = await workLogRepo.findById(input.workLog);
    if (!workLog) {
      throw new HttpError(404, 'Work log not found');
    }
    if (workLog.site.toString() !== input.site || workLog.contractor.toString() !== input.contractor) {
      throw new HttpError(422, 'Work log does not match the given site/contractor');
    }
    if (input.date < workLog.from || input.date > workLog.to) {
      throw new HttpError(422, "Date must fall within the work log's date range");
    }
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);
    if (input.date > endOfToday) {
      throw new HttpError(422, 'Cannot log work for a future date');
    }
    await workLogService.assertNotFullyPaid(input.workLog);

    const log = await dailyLogService.createDailyLog(input, req.user.id);
    const creatorNames = await resolveCreatorNames([req.user.id]);
    const output = validateResponse(DailyLogResponseSchema, {
      ...(toPlain(log) as Record<string, unknown>),
      createdByName: creatorNames.get(req.user.id),
    });
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

export async function listDailyLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(ListDailyLogsQuerySchema, req.query);
    const site = await resolveSiteFilter(req.user, query.site);
    const logs = await dailyLogService.listDailyLogs({ ...query, site });
    const creatorNames = await resolveCreatorNames(logs.map((log) => log.createdBy?.toString()));
    const output = validateResponse(
      DailyLogListResponseSchema,
      logs.map((log) => ({
        ...(toPlain(log) as Record<string, unknown>),
        createdByName: log.createdBy ? creatorNames.get(log.createdBy.toString()) : undefined,
      }))
    );
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function getDailyLog(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const log = await dailyLogService.getDailyLog(id);
    await assertSiteAccess(req.user, log.site.toString());
    const creatorNames = await resolveCreatorNames([log.createdBy?.toString()]);
    const output = validateResponse(DailyLogResponseSchema, {
      ...(toPlain(log) as Record<string, unknown>),
      createdByName: log.createdBy ? creatorNames.get(log.createdBy.toString()) : undefined,
    });
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function updateDailyLog(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const id = validateRequest(objectIdSchema, req.params.id);
    const existing = await dailyLogService.getDailyLog(id);
    await assertSiteAccess(req.user, existing.site.toString());
    assertOwnerOrAdmin(req.user, existing.createdBy);
    if (existing.workLog) {
      await workLogService.assertNotFullyPaid(existing.workLog.toString());
    }
    const input = validateRequest(UpdateDailyLogRequestSchema, req.body);
    const log = await dailyLogService.updateDailyLog(id, input);
    const output = validateResponse(DailyLogResponseSchema, toPlain(log));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function deleteDailyLog(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const id = validateRequest(objectIdSchema, req.params.id);
    const existing = await dailyLogService.getDailyLog(id);
    await assertSiteAccess(req.user, existing.site.toString());
    assertOwnerOrAdmin(req.user, existing.createdBy);
    if (existing.workLog) {
      await workLogService.assertNotFullyPaid(existing.workLog.toString());
    }
    await dailyLogService.deleteDailyLog(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
