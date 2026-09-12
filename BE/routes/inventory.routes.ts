import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItem,
  listInventoryItems,
  updateInventoryItem,
} from '../handlers/inventory.handler';
import {
  createInventoryTransaction,
  deleteInventoryTransaction,
  listInventoryTransactions,
} from '../handlers/inventoryTransaction.handler';
import { getInventoryLedger } from '../handlers/inventoryLedger.handler';

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);

inventoryRouter.get('/', listInventoryItems);
// Must come before '/:id' — otherwise Express would match "ledger" as an item id.
inventoryRouter.get('/ledger', getInventoryLedger);
inventoryRouter.get('/:id', getInventoryItem);
inventoryRouter.post('/', createInventoryItem);
inventoryRouter.put('/:id', updateInventoryItem);
inventoryRouter.delete('/:id', deleteInventoryItem);

inventoryRouter.get('/:itemId/transactions', listInventoryTransactions);
inventoryRouter.post('/:itemId/transactions', createInventoryTransaction);
inventoryRouter.delete('/:itemId/transactions/:transactionId', deleteInventoryTransaction);
