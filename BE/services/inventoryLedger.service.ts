import { inventoryRepo } from '../repositories/inventory.repo';
import { inventoryTransactionRepo } from '../repositories/inventoryTransaction.repo';
import { dateSequence } from '../utils/dateRange';

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const inventoryLedgerService = {
  async getLedger(siteId: string, from: string, to: string) {
    const [items, priorTx, rangeTx] = await Promise.all([
      inventoryRepo.findAll({ site: siteId }),
      inventoryTransactionRepo.findForSiteBefore(siteId, from),
      inventoryTransactionRepo.findForSiteInRange(siteId, from, to),
    ]);

    const openingBalanceByItem = new Map<string, number>();
    for (const tx of priorTx) {
      const itemId = tx.item.toString();
      const delta = tx.type === 'stock-in' ? tx.quantity : -tx.quantity;
      openingBalanceByItem.set(itemId, (openingBalanceByItem.get(itemId) ?? 0) + delta);
    }

    const dailyByItem = new Map<string, Map<string, { stockIn: number; usage: number }>>();
    for (const tx of rangeTx) {
      const itemId = tx.item.toString();
      const day = dateKey(tx.date);
      if (!dailyByItem.has(itemId)) {
        dailyByItem.set(itemId, new Map());
      }
      const perDay = dailyByItem.get(itemId)!;
      const entry = perDay.get(day) ?? { stockIn: 0, usage: 0 };
      if (tx.type === 'stock-in') {
        entry.stockIn += tx.quantity;
      } else {
        entry.usage += tx.quantity;
      }
      perDay.set(day, entry);
    }

    const dates = dateSequence(from, to);

    const resultItems = items.map((item) => {
      const itemId = item._id.toString();
      const openingBalance = openingBalanceByItem.get(itemId) ?? 0;
      const perDay = dailyByItem.get(itemId);

      let runningBalance = openingBalance;
      const days = dates.map((date) => {
        const entry = perDay?.get(date) ?? { stockIn: 0, usage: 0 };
        runningBalance += entry.stockIn - entry.usage;
        return { date, stockIn: entry.stockIn, usage: entry.usage, balance: runningBalance };
      });

      return {
        itemId,
        name: item.name,
        unit: item.unit,
        openingBalance,
        closingBalance: runningBalance,
        days,
      };
    });

    return { range: { from, to }, items: resultItems };
  },
};
