import { WagePaymentModel } from '../models/WagePayment';
import { createDoc, findAllDocs } from '../db/dbOpHelpers';

function toDateOnly(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

export const wagePaymentRepo = {
  create: (data: { site: string; contractor: string; workerType: string; from: string; to: string; amount: number }) =>
    createDoc(WagePaymentModel, { ...data, from: toDateOnly(data.from), to: toDateOnly(data.to) }),

  // Overlap, not containment: a payment recorded for a wider range (e.g. a full week)
  // must still be picked up when querying a narrower window inside it (e.g. one day
  // of that week, as the dashboard export lets you choose independently).
  findAllInRange: (site: string, from: string, to: string) =>
    findAllDocs(WagePaymentModel, { site, from: { $lte: toDateOnly(to) }, to: { $gte: toDateOnly(from) } }),

  async findPaginated(filter: { site: string; from?: string; to?: string }, page: number, limit: number) {
    const conditions: Record<string, unknown>[] = [{ site: filter.site }];
    // Search window overlap, not containment — same as findAllInRange above.
    if (filter.to) conditions.push({ from: { $lte: toDateOnly(filter.to) } });
    if (filter.from) conditions.push({ to: { $gte: toDateOnly(filter.from) } });
    const query = { $and: conditions };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      WagePaymentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      WagePaymentModel.countDocuments(query),
    ]);
    return { items, total, page, limit };
  },

  async sumForSite(site: string): Promise<number> {
    const payments = await WagePaymentModel.find({ site });
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  },

  deleteMatching: (params: { site: string; contractor: string; workerType: string; from: string; to: string }) =>
    WagePaymentModel.deleteMany({
      site: params.site,
      contractor: params.contractor,
      workerType: params.workerType,
      from: toDateOnly(params.from),
      to: toDateOnly(params.to),
    }),
};
