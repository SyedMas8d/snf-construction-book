import { InventoryTransactionModel } from '../models/InventoryTransaction';
import { createDoc, deleteDocById, findAllDocs, findDocById } from '../db/dbOpHelpers';
import { beforeDate, dateSpanRange, dayRange } from '../utils/dateRange';

export const inventoryTransactionRepo = {
  create: (data: Record<string, unknown>) => createDoc(InventoryTransactionModel, data),
  findByItem: (itemId: string, date?: string) =>
    findAllDocs(InventoryTransactionModel, {
      item: itemId,
      ...(date && { date: dayRange(date) }),
    }),
  findForSiteInRange: (site: string, from: string, to: string) =>
    findAllDocs(InventoryTransactionModel, { site, date: dateSpanRange(from, to) }),
  findForSiteBefore: (site: string, before: string) =>
    findAllDocs(InventoryTransactionModel, { site, date: beforeDate(before) }),
  findById: (id: string) => findDocById(InventoryTransactionModel, id),
  deleteById: (id: string) => deleteDocById(InventoryTransactionModel, id),
};
