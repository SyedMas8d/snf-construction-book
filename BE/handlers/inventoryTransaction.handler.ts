import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { inventoryTransactionService } from '../services/inventoryTransaction.service';
import { inventoryService } from '../services/inventory.service';
import { CreateInventoryTransactionRequestSchema } from '../schema/inventoryTransaction/inventoryTransaction.request.schema';
import {
  InventoryTransactionListResponseSchema,
  InventoryTransactionResponseSchema,
} from '../schema/inventoryTransaction/inventoryTransaction.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { objectIdSchema } from '../utils/objectId.schema';
import { dateOnlySchema } from '../utils/dateOnly.schema';
import { toPlain } from '../utils/toPlain';
import { assertSiteAccess } from '../utils/siteAccess';
import { resolveCreatorNames } from '../utils/resolveCreatorNames';
import { assertOwnerOrAdmin } from '../utils/ownership';
import { inventoryTransactionRepo } from '../repositories/inventoryTransaction.repo';
import { HttpError } from '../utils/httpError';

const ListInventoryTransactionsQuerySchema = z.object({
  date: dateOnlySchema.optional(),
});

export async function createInventoryTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const itemId = validateRequest(objectIdSchema, req.params.itemId);
    const item = await inventoryService.getInventoryItem(itemId);
    await assertSiteAccess(req.user, item.site.toString());
    const input = validateRequest(CreateInventoryTransactionRequestSchema, req.body);
    const transaction = await inventoryTransactionService.recordTransaction(itemId, input, req.user.id);
    const creatorNames = await resolveCreatorNames([req.user.id]);
    const output = validateResponse(InventoryTransactionResponseSchema, {
      ...(toPlain(transaction) as Record<string, unknown>),
      recordedByName: creatorNames.get(req.user.id),
    });
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

export async function listInventoryTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const itemId = validateRequest(objectIdSchema, req.params.itemId);
    const item = await inventoryService.getInventoryItem(itemId);
    await assertSiteAccess(req.user, item.site.toString());
    const query = validateRequest(ListInventoryTransactionsQuerySchema, req.query);
    const transactions = await inventoryTransactionService.listTransactions(itemId, query.date);
    const creatorNames = await resolveCreatorNames(transactions.map((t) => t.recordedBy?.toString()));
    const output = validateResponse(
      InventoryTransactionListResponseSchema,
      transactions.map((t) => ({
        ...(toPlain(t) as Record<string, unknown>),
        recordedByName: t.recordedBy ? creatorNames.get(t.recordedBy.toString()) : undefined,
      }))
    );
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function deleteInventoryTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const itemId = validateRequest(objectIdSchema, req.params.itemId);
    const item = await inventoryService.getInventoryItem(itemId);
    await assertSiteAccess(req.user, item.site.toString());
    const transactionId = validateRequest(objectIdSchema, req.params.transactionId);
    const existing = await inventoryTransactionRepo.findById(transactionId);
    if (!existing || existing.item.toString() !== itemId) {
      throw new HttpError(404, 'Inventory transaction not found');
    }
    assertOwnerOrAdmin(req.user, existing.recordedBy, 'You can only delete movements you recorded');
    await inventoryTransactionService.deleteTransaction(itemId, transactionId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
