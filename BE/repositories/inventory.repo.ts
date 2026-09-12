import { InventoryItemModel } from '../models/InventoryItem';
import { createDoc, deleteDocById, findAllDocs, findDocById, findPaginatedDocs, updateDocById } from '../db/dbOpHelpers';
import { CreateInventoryItemInput, UpdateInventoryItemInput } from '../schema/inventory/inventory.request.schema';
import { SiteScope } from '../utils/siteAccess';

export const inventoryRepo = {
  create: (data: CreateInventoryItemInput & { createdBy: string }) => createDoc(InventoryItemModel, data),
  findAll: (filter: { site?: SiteScope } = {}) => findAllDocs(InventoryItemModel, filter),
  findPaginated: (filter: { site?: SiteScope } = {}, page: number, limit: number) =>
    findPaginatedDocs(InventoryItemModel, filter, page, limit),
  findById: (id: string) => findDocById(InventoryItemModel, id),
  updateById: (id: string, data: UpdateInventoryItemInput) => updateDocById(InventoryItemModel, id, data),
  deleteById: (id: string) => deleteDocById(InventoryItemModel, id),

  // Atomically applies +delta (stock-in) or -delta (usage) to quantity.
  // For a negative delta, the filter guards against quantity going below zero —
  // returns null if there isn't enough stock, instead of racing a read-then-write.
  applyStockDelta: (id: string, delta: number) =>
    delta >= 0
      ? InventoryItemModel.findByIdAndUpdate(id, { $inc: { quantity: delta } }, { new: true })
      : InventoryItemModel.findOneAndUpdate(
          { _id: id, quantity: { $gte: -delta } },
          { $inc: { quantity: delta } },
          { new: true }
        ),
};
