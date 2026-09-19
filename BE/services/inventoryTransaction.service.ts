import { inventoryRepo } from '../repositories/inventory.repo';
import { inventoryTransactionRepo } from '../repositories/inventoryTransaction.repo';
import { CreateInventoryTransactionInput } from '../schema/inventoryTransaction/inventoryTransaction.request.schema';
import { HttpError } from '../utils/httpError';

export const inventoryTransactionService = {
  async recordTransaction(itemId: string, input: CreateInventoryTransactionInput, recordedBy: string) {
    const item = await inventoryRepo.findById(itemId);
    if (!item) {
      throw new HttpError(404, 'Inventory item not found');
    }

    const delta = input.type === 'stock-in' ? input.quantity : -input.quantity;
    const updatedItem = await inventoryRepo.applyStockDelta(itemId, delta);
    if (!updatedItem) {
      throw new HttpError(409, `Not enough stock: only ${item.quantity} ${item.unit} available`);
    }

    return inventoryTransactionRepo.create({
      site: item.site,
      item: itemId,
      type: input.type,
      quantity: input.quantity,
      date: input.date,
      previousQuantity: item.quantity,
      newQuantity: updatedItem.quantity,
      amount: input.amount,
      note: input.note,
      recordedBy,
    });
  },

  async listTransactions(itemId: string, date?: string) {
    const item = await inventoryRepo.findById(itemId);
    if (!item) {
      throw new HttpError(404, 'Inventory item not found');
    }
    return inventoryTransactionRepo.findByItem(itemId, date);
  },

  async deleteTransaction(itemId: string, transactionId: string) {
    const transaction = await inventoryTransactionRepo.findById(transactionId);
    if (!transaction || transaction.item.toString() !== itemId) {
      throw new HttpError(404, 'Inventory transaction not found');
    }

    // Reverse this transaction's effect on the running balance before removing it,
    // through the same atomic, negative-guarded update used when recording one —
    // e.g. deleting a stock-in that's since been used up would take stock negative.
    const reverseDelta = transaction.type === 'stock-in' ? -transaction.quantity : transaction.quantity;
    const updatedItem = await inventoryRepo.applyStockDelta(itemId, reverseDelta);
    if (!updatedItem) {
      throw new HttpError(
        409,
        'Cannot delete: reversing this entry would take stock negative. Delete later usage entries first.'
      );
    }

    await inventoryTransactionRepo.deleteById(transactionId);
    return updatedItem;
  },

  async updateAmount(itemId: string, transactionId: string, amount: number) {
    const transaction = await inventoryTransactionRepo.findById(transactionId);
    if (!transaction || transaction.item.toString() !== itemId) {
      throw new HttpError(404, 'Inventory transaction not found');
    }
    return inventoryTransactionRepo.updateAmount(transactionId, amount);
  },

  sumStockInAmountForSite: (site: string) => inventoryTransactionRepo.sumStockInAmountForSite(site),
};
