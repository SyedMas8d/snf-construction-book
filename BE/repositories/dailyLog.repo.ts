import { DailyLogModel } from '../models/DailyLog';
import { createDoc, deleteDocById, findAllDocs, findDocById, updateDocById } from '../db/dbOpHelpers';
import { CreateDailyLogInput, UpdateDailyLogInput } from '../schema/dailyLog/dailyLog.request.schema';
import { dateSpanRange } from '../utils/dateRange';
import { SiteScope } from '../utils/siteAccess';

export const dailyLogRepo = {
  create: (data: CreateDailyLogInput & { createdBy: string }) => createDoc(DailyLogModel, data),
  findAll: (
    filter: {
      site?: SiteScope;
      contractor?: string;
      workerType?: string;
      from?: string;
      to?: string;
      paid?: boolean;
      workLog?: string;
    } = {}
  ) =>
    findAllDocs(DailyLogModel, {
      ...(filter.site && { site: filter.site }),
      ...(filter.contractor && { contractor: filter.contractor }),
      ...(filter.workerType && { workerType: filter.workerType }),
      ...(filter.from && filter.to && { date: dateSpanRange(filter.from, filter.to) }),
      ...(filter.paid !== undefined && { paid: filter.paid }),
      ...(filter.workLog && { workLog: filter.workLog }),
    }),
  findAllInRange: (site: string, from: string, to: string) =>
    findAllDocs(DailyLogModel, { site, date: dateSpanRange(from, to) }),
  findById: (id: string) => findDocById(DailyLogModel, id),
  updateById: (id: string, data: UpdateDailyLogInput) => updateDocById(DailyLogModel, id, data),
  deleteById: (id: string) => deleteDocById(DailyLogModel, id),
  markPaid: (params: PaidRangeParams) => setPaid(params, true),
  markUnpaid: (params: PaidRangeParams) => setPaid(params, false),
};

type PaidRangeParams = { site: string; contractor: string; workerType: string; from: string; to: string };

function setPaid({ site, contractor, workerType, from, to }: PaidRangeParams, paid: boolean) {
  return DailyLogModel.updateMany({ site, contractor, workerType, date: dateSpanRange(from, to) }, { $set: { paid } });
}
