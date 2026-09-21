import { dailyLogRepo } from '../repositories/dailyLog.repo';
import { contractorRepo } from '../repositories/contractor.repo';
import { wagePaymentRepo } from '../repositories/wagePayment.repo';
import { siteRepo } from '../repositories/site.repo';
import { workLogRepo } from '../repositories/workLog.repo';
import { enterpriseSettingsService } from './enterpriseSettings.service';
import {
  MarkWagesPaidInput,
  MarkWagesUnpaidInput,
  PayWorkLogInput,
  UnpayWorkLogInput,
} from '../schema/wage/wage.request.schema';
import { RecentWagePayment, WageSummaryRow, WorkLogPayable } from '../schema/wage/wage.response.schema';
import { PaysheetData, PaysheetRow } from '../reports/wagePaysheet';
import { SiteScope } from '../utils/siteAccess';
import { todayDateOnly } from '../utils/dateRange';
import { HttpError } from '../utils/httpError';

function buildDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

type SummaryGroup = {
  contractorId: string;
  contractorName: string;
  workerType: string;
  dates: Set<string>;
  unpaidDates: Set<string>;
  totalWorkerCount: number;
  unpaidWorkerCount: number;
};

export const wageService = {
  async getSummary(site: string, from: string, to: string): Promise<WageSummaryRow[]> {
    const [logs, contractors, payments] = await Promise.all([
      dailyLogRepo.findAllInRange(site, from, to),
      contractorRepo.findAll({ site }),
      wagePaymentRepo.findAllInRange(site, from, to),
    ]);

    const contractorNameById = new Map(contractors.map((c) => [c._id.toString(), c.name]));
    const groups = new Map<string, SummaryGroup>();

    for (const log of logs) {
      const contractorId = log.contractor.toString();
      const dateStr = log.date.toISOString().slice(0, 10);
      const key = `${contractorId}:${log.workerType}`;
      const group =
        groups.get(key) ??
        ({
          contractorId,
          contractorName: contractorNameById.get(contractorId) ?? 'Unknown contractor',
          workerType: log.workerType,
          dates: new Set<string>(),
          unpaidDates: new Set<string>(),
          totalWorkerCount: 0,
          unpaidWorkerCount: 0,
        } as SummaryGroup);

      group.dates.add(dateStr);
      group.totalWorkerCount += log.count;
      if (!log.paid) {
        group.unpaidDates.add(dateStr);
        group.unpaidWorkerCount += log.count;
      }
      groups.set(key, group);
    }

    const paidAmountByKey = new Map<string, number>();
    for (const payment of payments) {
      const key = `${payment.contractor.toString()}:${payment.workerType}`;
      paidAmountByKey.set(key, (paidAmountByKey.get(key) ?? 0) + payment.amount);
    }

    return Array.from(groups.values()).map((g) => ({
      contractorId: g.contractorId,
      contractorName: g.contractorName,
      workerType: g.workerType,
      daysWorked: g.dates.size,
      totalWorkerCount: g.totalWorkerCount,
      unpaidDays: g.unpaidDates.size,
      unpaidWorkerCount: g.unpaidWorkerCount,
      paidAmount: paidAmountByKey.get(`${g.contractorId}:${g.workerType}`) ?? 0,
    }));
  },

  async getWorkLogPayables(site: SiteScope): Promise<WorkLogPayable[]> {
    const [workLogs, contractors] = await Promise.all([
      workLogRepo.findAll({ site }),
      contractorRepo.findAll({ site }),
    ]);

    const contractorNameById = new Map(contractors.map((c) => [c._id.toString(), c.name]));

    const payables = await Promise.all(
      workLogs.map(async (workLog) => {
        const from = workLog.from.toISOString().slice(0, 10);
        const to = workLog.to.toISOString().slice(0, 10);
        const contractorId = workLog.contractor.toString();

        const [logs, payments] = await Promise.all([
          dailyLogRepo.findAll({ workLog: workLog._id.toString() }),
          wagePaymentRepo.findAllInRange(workLog.site.toString(), from, to),
        ]);

        type Group = { workerType: string; totalWorkerCount: number; unpaidWorkerCount: number };
        const groups = new Map<string, Group>();
        for (const log of logs) {
          const group = groups.get(log.workerType) ?? { workerType: log.workerType, totalWorkerCount: 0, unpaidWorkerCount: 0 };
          group.totalWorkerCount += log.count;
          if (!log.paid) group.unpaidWorkerCount += log.count;
          groups.set(log.workerType, group);
        }

        const paidAmountByWorkerType = new Map<string, number>();
        for (const payment of payments) {
          if (payment.contractor.toString() !== contractorId) continue;
          paidAmountByWorkerType.set(
            payment.workerType,
            (paidAmountByWorkerType.get(payment.workerType) ?? 0) + payment.amount
          );
        }

        return {
          workLogId: workLog._id.toString(),
          contractorId,
          contractorName: contractorNameById.get(contractorId) ?? 'Unknown contractor',
          from,
          to,
          rows: Array.from(groups.values()).map((g) => ({
            workerType: g.workerType,
            totalWorkerCount: g.totalWorkerCount,
            unpaidWorkerCount: g.unpaidWorkerCount,
            paidAmount: paidAmountByWorkerType.get(g.workerType) ?? 0,
          })),
        };
      })
    );

    return payables.filter((p) => p.rows.length > 0);
  },

  async getRecentPayments(
    site: string,
    page: number,
    limit: number,
    from?: string,
    to?: string
  ): Promise<{ items: RecentWagePayment[]; total: number; page: number; limit: number }> {
    const [{ items: payments, total }, contractors] = await Promise.all([
      wagePaymentRepo.findPaginated({ site, from, to }, page, limit),
      contractorRepo.findAll({ site }),
    ]);

    const contractorNameById = new Map(contractors.map((c) => [c._id.toString(), c.name]));

    const items = payments.map((payment) => ({
      paymentId: payment._id.toString(),
      contractorId: payment.contractor.toString(),
      contractorName: contractorNameById.get(payment.contractor.toString()) ?? 'Unknown contractor',
      workerType: payment.workerType,
      from: payment.from.toISOString().slice(0, 10),
      to: payment.to.toISOString().slice(0, 10),
      amount: payment.amount,
    }));

    return { items, total, page, limit };
  },

  async getPaysheetData(site: string, from: string, to: string, ownerId: string, contractor?: string): Promise<PaysheetData> {
    const [allLogs, contractors, allPayments, siteDoc, company] = await Promise.all([
      dailyLogRepo.findAllInRange(site, from, to),
      contractorRepo.findAll({ site }),
      wagePaymentRepo.findAllInRange(site, from, to),
      siteRepo.findById(site),
      enterpriseSettingsService.get(ownerId),
    ]);

    const logs = contractor ? allLogs.filter((log) => log.contractor.toString() === contractor) : allLogs;
    const payments = contractor
      ? allPayments.filter((payment) => payment.contractor.toString() === contractor)
      : allPayments;

    const contractorNameById = new Map(contractors.map((c) => [c._id.toString(), c.name]));

    type Group = {
      contractorName: string;
      workerType: string;
      dailyCounts: Map<string, number>;
      totalLabours: number;
    };
    const groups = new Map<string, Group>();

    for (const log of logs) {
      const contractorId = log.contractor.toString();
      const dateStr = log.date.toISOString().slice(0, 10);
      const key = `${contractorId}:${log.workerType}`;
      const group =
        groups.get(key) ??
        ({
          contractorName: contractorNameById.get(contractorId) ?? 'Unknown contractor',
          workerType: log.workerType,
          dailyCounts: new Map<string, number>(),
          totalLabours: 0,
        } as Group);

      group.dailyCounts.set(dateStr, (group.dailyCounts.get(dateStr) ?? 0) + log.count);
      group.totalLabours += log.count;
      groups.set(key, group);
    }

    const amountByKey = new Map<string, number>();
    for (const payment of payments) {
      const key = `${payment.contractor.toString()}:${payment.workerType}`;
      amountByKey.set(key, (amountByKey.get(key) ?? 0) + payment.amount);
    }

    const rows: PaysheetRow[] = Array.from(groups.entries()).map(([key, g]) => {
      const amount = amountByKey.get(key) ?? 0;
      return {
        contractorName: g.contractorName,
        workerType: g.workerType,
        dailyCounts: Object.fromEntries(g.dailyCounts),
        totalLabours: g.totalLabours,
        amount,
        ratePerDay: amount > 0 && g.totalLabours > 0 ? Math.round((amount / g.totalLabours) * 100) / 100 : null,
      };
    });

    return {
      company,
      site: { name: siteDoc?.name ?? '', address: siteDoc?.address ?? '' },
      range: { from, to },
      dates: buildDateRange(from, to),
      rows,
      overallTotalLabours: rows.reduce((sum, r) => sum + r.totalLabours, 0),
      overallTotalAmount: rows.reduce((sum, r) => sum + r.amount, 0),
    };
  },

  async markPaid(input: MarkWagesPaidInput) {
    const { amount, ...range } = input;
    await dailyLogRepo.markPaid(range);
    await wagePaymentRepo.create({ ...range, amount });
  },

  async markUnpaid(input: MarkWagesUnpaidInput) {
    await dailyLogRepo.markUnpaid(input);
    await wagePaymentRepo.deleteMatching(input);
  },

  // Pays every worker type on a work log's card in one action. If the work log's
  // end date is still in the future, it gets closed early — truncated to the last
  // date that actually has a logged entry — since we're paying for work already
  // done, not work that hasn't happened yet. The remaining future days are left
  // for a new work log the admin creates separately.
  async payWorkLog(input: PayWorkLogInput) {
    const workLog = await workLogRepo.findById(input.workLogId);
    if (!workLog) {
      throw new HttpError(404, 'Work log not found');
    }

    const logs = await dailyLogRepo.findAll({ workLog: input.workLogId });
    if (logs.length === 0) {
      throw new HttpError(422, 'This work log has no entries to pay yet');
    }

    const from = workLog.from.toISOString().slice(0, 10);
    const originalTo = workLog.to.toISOString().slice(0, 10);
    const lastEntryDate = logs.reduce((max, log) => {
      const dateStr = log.date.toISOString().slice(0, 10);
      return dateStr > max ? dateStr : max;
    }, logs[0].date.toISOString().slice(0, 10));

    let to = originalTo;
    let truncated = false;
    if (originalTo > todayDateOnly()) {
      to = lastEntryDate;
      truncated = true;
      await workLogRepo.updateById(input.workLogId, { from, to });
    }

    for (const entry of input.entries) {
      await dailyLogRepo.markPaid({ site: input.site, contractor: input.contractor, workerType: entry.workerType, from, to });
      await wagePaymentRepo.create({
        site: input.site,
        contractor: input.contractor,
        workerType: entry.workerType,
        from,
        to,
        amount: entry.amount,
      });
    }

    return { truncated, to };
  },

  async unpayWorkLog(input: UnpayWorkLogInput) {
    const workLog = await workLogRepo.findById(input.workLogId);
    if (!workLog) {
      throw new HttpError(404, 'Work log not found');
    }
    const from = workLog.from.toISOString().slice(0, 10);
    const to = workLog.to.toISOString().slice(0, 10);

    for (const workerType of input.workerTypes) {
      await dailyLogRepo.markUnpaid({ site: input.site, contractor: input.contractor, workerType, from, to });
      await wagePaymentRepo.deleteMatching({ site: input.site, contractor: input.contractor, workerType, from, to });
    }
  },
};
