import { dailyLogRepo } from '../repositories/dailyLog.repo';
import { CreateDailyLogInput, UpdateDailyLogInput } from '../schema/dailyLog/dailyLog.request.schema';
import { HttpError } from '../utils/httpError';
import { SiteScope } from '../utils/siteAccess';

export const dailyLogService = {
  createDailyLog: (input: CreateDailyLogInput, createdBy: string) =>
    dailyLogRepo.create({ ...input, createdBy }),

  listDailyLogs: (filter: {
    site?: SiteScope;
    contractor?: string;
    workerType?: string;
    from?: string;
    to?: string;
    workLog?: string;
  }) => dailyLogRepo.findAll(filter),

  async getDailyLog(id: string) {
    const log = await dailyLogRepo.findById(id);
    if (!log) {
      throw new HttpError(404, 'Daily log not found');
    }
    return log;
  },

  async updateDailyLog(id: string, input: UpdateDailyLogInput) {
    const log = await dailyLogRepo.updateById(id, input);
    if (!log) {
      throw new HttpError(404, 'Daily log not found');
    }
    return log;
  },

  async deleteDailyLog(id: string) {
    const log = await dailyLogRepo.deleteById(id);
    if (!log) {
      throw new HttpError(404, 'Daily log not found');
    }
    return log;
  },
};
