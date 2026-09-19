import { dailyLogRepo } from '../repositories/dailyLog.repo';
import { inventoryRepo } from '../repositories/inventory.repo';
import { inventoryTransactionRepo } from '../repositories/inventoryTransaction.repo';
import { contractorRepo } from '../repositories/contractor.repo';
import { wagePaymentRepo } from '../repositories/wagePayment.repo';
import { workLogRepo } from '../repositories/workLog.repo';
import { siteRepo } from '../repositories/site.repo';
import { customerPaymentRepo } from '../repositories/customerPayment.repo';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { InventoryItem } from '../models/InventoryItem';
import { HydratedDocument } from 'mongoose';
import { WageExportEntry, WageExportGroup } from '../reports/dashboardWorkbook';
import { HttpError } from '../utils/httpError';

type ItemBreakdown = {
  itemId: string;
  name: string;
  unit: string;
  stockIn: number;
  usage: number;
  balanceStock: number;
};

function groupTransactionsByItem(
  transactions: HydratedDocument<InventoryTransaction>[],
  items: HydratedDocument<InventoryItem>[]
): ItemBreakdown[] {
  const itemMetaById = new Map(
    items.map((item) => [item._id.toString(), { name: item.name, unit: item.unit, quantity: item.quantity }])
  );
  const byItemMap = new Map<string, ItemBreakdown>();

  for (const tx of transactions) {
    const itemId = tx.item.toString();
    const meta = itemMetaById.get(itemId) ?? { name: 'Unknown item', unit: '', quantity: 0 };
    const entry =
      byItemMap.get(itemId) ??
      ({ itemId, name: meta.name, unit: meta.unit, stockIn: 0, usage: 0, balanceStock: meta.quantity } as ItemBreakdown);

    if (tx.type === 'stock-in') {
      entry.stockIn += tx.quantity;
    } else {
      entry.usage += tx.quantity;
    }
    byItemMap.set(itemId, entry);
  }

  return Array.from(byItemMap.values());
}

export const dashboardService = {
  async getSummary(siteId: string) {
    const site = await siteRepo.findById(siteId);
    if (!site) {
      throw new HttpError(404, 'Site not found');
    }
    const [totalReceived, totalWagesPaid, totalMaterialSpend] = await Promise.all([
      customerPaymentRepo.sumForSite(siteId),
      wagePaymentRepo.sumForSite(siteId),
      inventoryTransactionRepo.sumStockInAmountForSite(siteId),
    ]);

    return {
      estimatedCost: site.estimatedCost,
      notes: site.notes,
      totalReceived,
      totalWagesPaid,
      totalMaterialSpend,
    };
  },

  async getExportData(siteId: string, from: string, to: string) {
    const [dailyLogs, transactions, items, contractors, payments, workLogs] = await Promise.all([
      dailyLogRepo.findAllInRange(siteId, from, to),
      inventoryTransactionRepo.findForSiteInRange(siteId, from, to),
      inventoryRepo.findAll({ site: siteId }),
      contractorRepo.findAll({ site: siteId }),
      wagePaymentRepo.findAllInRange(siteId, from, to),
      workLogRepo.findAll({ site: siteId }),
    ]);

    const contractorNameById = new Map(contractors.map((c) => [c._id.toString(), c.name]));
    const workLogById = new Map(workLogs.map((wl) => [wl._id.toString(), wl]));

    // A single (contractor, workerType) pair can span several separate work logs over time,
    // each paid independently — so the group key includes the work log, and each group's
    // Amount comes from the payment recorded for that exact work log's date range, not a
    // guess based on whatever range the admin happened to pick for this export.
    type Group = {
      contractorId: string;
      contractorName: string;
      workerType: string;
      workLogId: string | null;
      dailyCounts: Map<string, { count: number; paid: boolean; notes: Set<string> }>;
      totalWorkerCount: number;
    };
    const groups = new Map<string, Group>();

    for (const log of dailyLogs) {
      const contractorId = log.contractor.toString();
      const workLogId = log.workLog ? log.workLog.toString() : null;
      const dateStr = log.date.toISOString().slice(0, 10);
      const key = `${contractorId}:${log.workerType}:${workLogId ?? 'none'}`;
      const group =
        groups.get(key) ??
        ({
          contractorId,
          contractorName: contractorNameById.get(contractorId) ?? 'Unknown contractor',
          workerType: log.workerType,
          workLogId,
          dailyCounts: new Map(),
          totalWorkerCount: 0,
        } as Group);

      const existing = group.dailyCounts.get(dateStr);
      group.dailyCounts.set(dateStr, {
        count: (existing?.count ?? 0) + log.count,
        paid: existing ? existing.paid && log.paid : log.paid,
        notes: existing?.notes ?? new Set<string>(),
      });
      if (log.notes) group.dailyCounts.get(dateStr)!.notes.add(log.notes);
      group.totalWorkerCount += log.count;
      groups.set(key, group);
    }

    const paymentsByContractorWorkerType = new Map<string, typeof payments>();
    for (const payment of payments) {
      const key = `${payment.contractor.toString()}:${payment.workerType}`;
      const list = paymentsByContractorWorkerType.get(key) ?? [];
      list.push(payment);
      paymentsByContractorWorkerType.set(key, list);
    }

    function amountForGroup(g: Group): number {
      const candidates = paymentsByContractorWorkerType.get(`${g.contractorId}:${g.workerType}`) ?? [];
      if (!g.workLogId) {
        // Legacy entries with no work log — best effort: sum every payment for this pair.
        return candidates.reduce((sum, p) => sum + p.amount, 0);
      }
      const workLog = workLogById.get(g.workLogId);
      if (!workLog) return 0;
      const wlFrom = workLog.from.toISOString().slice(0, 10);
      const wlTo = workLog.to.toISOString().slice(0, 10);
      return candidates
        .filter((p) => p.from.toISOString().slice(0, 10) === wlFrom && p.to.toISOString().slice(0, 10) === wlTo)
        .reduce((sum, p) => sum + p.amount, 0);
    }

    const wageGroups: WageExportGroup[] = Array.from(groups.values()).map((g) => {
      const entries: WageExportEntry[] = Array.from(g.dailyCounts.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, v]) => ({
          date,
          count: v.count,
          paid: v.paid,
          notes: v.notes.size > 0 ? Array.from(v.notes).join('; ') : undefined,
        }));

      return {
        contractorName: g.contractorName,
        workerType: g.workerType,
        entries,
        totalWorkerCount: g.totalWorkerCount,
        amount: amountForGroup(g),
      };
    });

    const inventoryRows = groupTransactionsByItem(transactions, items).map(
      ({ name, unit, stockIn, usage, balanceStock }) => ({
        name,
        unit,
        stockIn,
        usage,
        balanceStock,
      })
    );

    return {
      range: { from, to },
      wageGroups,
      inventoryRows,
    };
  },
};
