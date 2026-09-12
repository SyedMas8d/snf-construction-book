import { NextFunction, Request, Response } from 'express';
import { inventoryService, isLowStock } from '../services/inventory.service';
import {
  CreateInventoryItemRequestSchema,
  ListInventoryItemsQuerySchema,
  UpdateInventoryItemRequestSchema,
} from '../schema/inventory/inventory.request.schema';
import {
  InventoryItemResponseSchema,
  PaginatedInventoryItemListResponseSchema,
} from '../schema/inventory/inventory.response.schema';
import { validateRequest, validateResponse } from '../utils/zodValidate';
import { objectIdSchema } from '../utils/objectId.schema';
import { toPlain } from '../utils/toPlain';
import { assertSiteAccess, resolveSiteFilter } from '../utils/siteAccess';
import { resolveCreatorNames } from '../utils/resolveCreatorNames';
import { HttpError } from '../utils/httpError';
import { InventoryItem } from '../models/InventoryItem';
import { HydratedDocument } from 'mongoose';

function toInventoryResponse(item: HydratedDocument<InventoryItem>, creatorNames: Map<string, string>) {
  return {
    ...(toPlain(item) as object),
    lowStock: isLowStock(item),
    createdByName: item.createdBy ? creatorNames.get(item.createdBy.toString()) : undefined,
  };
}

export async function createInventoryItem(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const input = validateRequest(CreateInventoryItemRequestSchema, req.body);
    await assertSiteAccess(req.user, input.site);
    const item = await inventoryService.createInventoryItem(input, req.user.id);
    const creatorNames = await resolveCreatorNames([req.user.id]);
    const output = validateResponse(InventoryItemResponseSchema, toInventoryResponse(item, creatorNames));
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

export async function listInventoryItems(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validateRequest(ListInventoryItemsQuerySchema, req.query);
    const site = await resolveSiteFilter(req.user, query.site);
    const result = await inventoryService.listInventoryItems(site, query.page, query.limit);
    const creatorNames = await resolveCreatorNames(result.items.map((item) => item.createdBy?.toString()));
    const output = validateResponse(PaginatedInventoryItemListResponseSchema, {
      items: result.items.map((item) => toInventoryResponse(item, creatorNames)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function getInventoryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const item = await inventoryService.getInventoryItem(id);
    await assertSiteAccess(req.user, item.site.toString());
    const creatorNames = await resolveCreatorNames([item.createdBy?.toString()]);
    const output = validateResponse(InventoryItemResponseSchema, toInventoryResponse(item, creatorNames));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function updateInventoryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const existing = await inventoryService.getInventoryItem(id);
    await assertSiteAccess(req.user, existing.site.toString());
    const input = validateRequest(UpdateInventoryItemRequestSchema, req.body);
    const item = await inventoryService.updateInventoryItem(id, input);
    const creatorNames = await resolveCreatorNames([item.createdBy?.toString()]);
    const output = validateResponse(InventoryItemResponseSchema, toInventoryResponse(item, creatorNames));
    res.json(output);
  } catch (err) {
    next(err);
  }
}

export async function deleteInventoryItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = validateRequest(objectIdSchema, req.params.id);
    const existing = await inventoryService.getInventoryItem(id);
    await assertSiteAccess(req.user, existing.site.toString());
    await inventoryService.deleteInventoryItem(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
