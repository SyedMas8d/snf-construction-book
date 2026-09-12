import { WorkLogModel } from '../models/WorkLog';
import { createDoc, deleteDocById, findAllDocs, findDocById } from '../db/dbOpHelpers';
import { CreateWorkLogInput, WorkLogBucket } from '../schema/workLog/workLog.request.schema';
import { SiteScope } from '../utils/siteAccess';

function toDateOnly(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

export const workLogRepo = {
  create: (data: CreateWorkLogInput & { createdBy: string }) =>
    createDoc(WorkLogModel, { ...data, from: toDateOnly(data.from), to: toDateOnly(data.to) }),
  findAll: (filter: { site?: SiteScope; contractor?: string } = {}) =>
    findAllDocs(WorkLogModel, {
      ...(filter.site && { site: filter.site }),
      ...(filter.contractor && { contractor: filter.contractor }),
    }),
  async findPaginated(
    filter: {
      site?: SiteScope;
      contractor?: string;
      bucket?: WorkLogBucket;
      from?: string;
      to?: string;
    },
    page: number,
    limit: number
  ) {
    const conditions: Record<string, unknown>[] = [];
    if (filter.site) conditions.push({ site: filter.site });
    if (filter.contractor) conditions.push({ contractor: filter.contractor });

    const today = toDateOnly(new Date().toISOString().slice(0, 10));
    if (filter.bucket === 'current') {
      conditions.push({ from: { $lte: today } }, { to: { $gte: today } });
    } else if (filter.bucket === 'upcoming') {
      conditions.push({ from: { $gt: today } });
    } else if (filter.bucket === 'previous') {
      conditions.push({ to: { $lt: today } });
    }

    // Search window overlap, not containment — a work log counts as a match if any
    // part of its range falls inside [from, to].
    if (filter.to) conditions.push({ from: { $lte: toDateOnly(filter.to) } });
    if (filter.from) conditions.push({ to: { $gte: toDateOnly(filter.from) } });

    const query = conditions.length > 0 ? { $and: conditions } : {};
    const sort: Record<string, 1 | -1> = filter.bucket === 'upcoming' ? { from: 1 } : { from: -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      WorkLogModel.find(query).sort(sort).skip(skip).limit(limit),
      WorkLogModel.countDocuments(query),
    ]);
    return { items, total, page, limit };
  },
  findById: (id: string) => findDocById(WorkLogModel, id),
  // Overlap, not containment: any existing work log for this contractor whose range
  // touches the given [from, to] window counts as a conflict.
  findOverlapping: (params: { site: string; contractor: string; from: string; to: string; excludeId?: string }) =>
    findAllDocs(WorkLogModel, {
      site: params.site,
      contractor: params.contractor,
      from: { $lte: toDateOnly(params.to) },
      to: { $gte: toDateOnly(params.from) },
      ...(params.excludeId && { _id: { $ne: params.excludeId } }),
    }),
  updateById: (id: string, data: { from: string; to: string }) =>
    WorkLogModel.findByIdAndUpdate(
      id,
      { from: toDateOnly(data.from), to: toDateOnly(data.to) },
      { new: true, runValidators: true }
    ),
  deleteById: (id: string) => deleteDocById(WorkLogModel, id),
};
