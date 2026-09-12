import { z } from 'zod';
import { InventoryCategoryEnum } from './inventory.request.schema';
import { objectIdSchema } from '../../utils/objectId.schema';

export const InventoryItemResponseSchema = z.object({
  _id: objectIdSchema,
  site: objectIdSchema,
  name: z.string(),
  category: InventoryCategoryEnum,
  unit: z.string(),
  quantity: z.number(),
  minThreshold: z.number().optional(),
  lowStock: z.boolean(),
  createdBy: objectIdSchema.optional(),
  createdByName: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type InventoryItemResponse = z.infer<typeof InventoryItemResponseSchema>;

export const InventoryItemListResponseSchema = z.array(InventoryItemResponseSchema);

export const PaginatedInventoryItemListResponseSchema = z.object({
  items: z.array(InventoryItemResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type PaginatedInventoryItemListResponse = z.infer<typeof PaginatedInventoryItemListResponseSchema>;
