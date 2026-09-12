import { NextFunction, Request, Response } from 'express';
import { inventoryLedgerService } from '../services/inventoryLedger.service';
import { InventoryLedgerQuerySchema } from '../schema/inventoryLedger/inventoryLedger.request.schema';
import { InventoryLedgerResponseSchema } from '../schema/inventoryLedger/inventoryLedger.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { assertSiteAccess } from '../utils/siteAccess';

export async function getInventoryLedger(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(InventoryLedgerQuerySchema, req.query);
    await assertSiteAccess(req.user, query.site);
    const ledger = await inventoryLedgerService.getLedger(query.site, query.from, query.to);
    const output = validateResponse(InventoryLedgerResponseSchema, ledger);
    res.json(output);
  } catch (err) {
    next(err);
  }
}
