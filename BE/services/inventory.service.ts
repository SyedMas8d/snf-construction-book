import { inventoryRepo } from '../repositories/inventory.repo';
import { CreateInventoryItemInput, UpdateInventoryItemInput } from '../schema/inventory/inventory.request.schema';
import { HttpError } from '../utils/httpError';
import { SiteScope } from '../utils/siteAccess';

export function isLowStock(item: { quantity: number; minThreshold?: number | null }): boolean {
  return item.minThreshold != null && item.quantity < item.minThreshold;
}

export const inventoryService = {
  createInventoryItem: (input: CreateInventoryItemInput, createdBy: string) =>
    inventoryRepo.create({ ...input, createdBy }),

  listInventoryItems: (site: SiteScope | undefined, page: number, limit: number) =>
    inventoryRepo.findPaginated(site ? { site } : {}, page, limit),

  async getInventoryItem(id: string) {
    const item = await inventoryRepo.findById(id);
    if (!item) {
      throw new HttpError(404, 'Inventory item not found');
    }
    return item;
  },

  async updateInventoryItem(id: string, input: UpdateInventoryItemInput) {
    const item = await inventoryRepo.updateById(id, input);
    if (!item) {
      throw new HttpError(404, 'Inventory item not found');
    }
    return item;
  },

  async deleteInventoryItem(id: string) {
    const item = await inventoryRepo.deleteById(id);
    if (!item) {
      throw new HttpError(404, 'Inventory item not found');
    }
    return item;
  },
};
