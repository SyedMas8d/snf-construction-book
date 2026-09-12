import { workLogRepo } from '../repositories/workLog.repo';
import { dailyLogRepo } from '../repositories/dailyLog.repo';
import { contractorRepo } from '../repositories/contractor.repo';
import { CreateWorkLogInput, UpdateWorkLogInput, WorkLogBucket } from '../schema/workLog/workLog.request.schema';
import { SiteScope } from '../utils/siteAccess';
import { resolveCreatorNames } from '../utils/resolveCreatorNames';
import { HttpError } from '../utils/httpError';

export const workLogService = {
  async createWorkLog(input: CreateWorkLogInput, createdBy: string) {
    const overlapping = await workLogRepo.findOverlapping({
      site: input.site,
      contractor: input.contractor,
      from: input.from,
      to: input.to,
    });
    if (overlapping.length > 0) {
      throw new HttpError(422, 'Date overlap already exists for this contractor');
    }
    return workLogRepo.create({ ...input, createdBy });
  },

  async getOverlaps(site: string, contractorIds: string[], from: string, to: string) {
    const contractors = await contractorRepo.findAll({ site });
    const nameById = new Map(contractors.map((c) => [c._id.toString(), c.name]));

    const results = await Promise.all(
      contractorIds.map(async (contractorId) => {
        const overlapping = await workLogRepo.findOverlapping({ site, contractor: contractorId, from, to });
        return {
          contractorId,
          contractorName: nameById.get(contractorId) ?? 'Unknown contractor',
          ranges: overlapping.map((w) => ({
            from: w.from.toISOString().slice(0, 10),
            to: w.to.toISOString().slice(0, 10),
          })),
        };
      })
    );

    return results.filter((r) => r.ranges.length > 0);
  },

  async isFullyPaid(workLogId: string): Promise<boolean> {
    const entries = await dailyLogRepo.findAll({ workLog: workLogId });
    return entries.length > 0 && entries.every((entry) => entry.paid);
  },

  async assertNotFullyPaid(workLogId: string): Promise<void> {
    if (await workLogService.isFullyPaid(workLogId)) {
      throw new HttpError(422, 'This work log is fully paid and can no longer be edited');
    }
  },

  async listWorkLogs(
    filter: { site?: SiteScope; contractor?: string; bucket?: WorkLogBucket; from?: string; to?: string },
    page: number,
    limit: number
  ) {
    const { items: workLogs, total } = await workLogRepo.findPaginated(filter, page, limit);
    const site = filter.site;
    const contractors = await contractorRepo.findAll(site ? { site } : {});
    const contractorNameById = new Map(contractors.map((c) => [c._id.toString(), c.name]));
    const creatorNames = await resolveCreatorNames(workLogs.map((w) => w.createdBy?.toString()));

    const items = await Promise.all(
      workLogs.map(async (workLog) => {
        const logs = await dailyLogRepo.findAll({ workLog: workLog._id.toString() });
        return {
          _id: workLog._id.toString(),
          site: workLog.site.toString(),
          contractor: workLog.contractor.toString(),
          contractorName: contractorNameById.get(workLog.contractor.toString()) ?? 'Unknown contractor',
          from: workLog.from,
          to: workLog.to,
          createdBy: workLog.createdBy?.toString(),
          createdByName: workLog.createdBy ? creatorNames.get(workLog.createdBy.toString()) : undefined,
          entryCount: logs.length,
          totalWorkerCount: logs.reduce((sum, log) => sum + log.count, 0),
          fullyPaid: logs.length > 0 && logs.every((log) => log.paid),
          createdAt: workLog.createdAt,
          updatedAt: workLog.updatedAt,
        };
      })
    );

    return { items, total, page, limit };
  },

  async getWorkLog(id: string) {
    const workLog = await workLogRepo.findById(id);
    if (!workLog) {
      throw new HttpError(404, 'Work log not found');
    }
    return workLog;
  },

  async updateWorkLog(id: string, input: UpdateWorkLogInput) {
    const existing = await workLogRepo.findById(id);
    if (!existing) {
      throw new HttpError(404, 'Work log not found');
    }

    await workLogService.assertNotFullyPaid(id);

    const entries = await dailyLogRepo.findAll({ workLog: id });
    const outOfRange = entries.filter((entry) => {
      const dateStr = entry.date.toISOString().slice(0, 10);
      return dateStr < input.from || dateStr > input.to;
    });
    if (outOfRange.length > 0) {
      throw new HttpError(
        422,
        `This range would exclude ${outOfRange.length} existing entr${outOfRange.length === 1 ? 'y' : 'ies'} — delete ${outOfRange.length === 1 ? 'it' : 'them'} first, or choose a range that still covers ${outOfRange.length === 1 ? 'it' : 'them'}`
      );
    }

    const overlapping = await workLogRepo.findOverlapping({
      site: existing.site.toString(),
      contractor: existing.contractor.toString(),
      from: input.from,
      to: input.to,
      excludeId: id,
    });
    if (overlapping.length > 0) {
      throw new HttpError(422, 'Date overlap already exists for this contractor');
    }

    return workLogRepo.updateById(id, input);
  },

  async deleteWorkLog(id: string) {
    const entryCount = (await dailyLogRepo.findAll({ workLog: id })).length;
    if (entryCount > 0) {
      throw new HttpError(422, 'Cannot delete a work log that still has entries — delete its entries first');
    }
    const workLog = await workLogRepo.deleteById(id);
    if (!workLog) {
      throw new HttpError(404, 'Work log not found');
    }
    return workLog;
  },
};
