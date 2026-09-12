import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

export const InventoryCategoryEnum = z.enum(['material', 'tool', 'equipment']);

export const CreateInventoryItemRequestSchema = z.object({
  site: objectIdSchema,
  name: z.string().trim().min(1),
  category: InventoryCategoryEnum,
  unit: z.string().trim().min(1),
  quantity: z.coerce.number().min(0).default(0),
  minThreshold: z.coerce.number().min(0).optional(),
});
export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemRequestSchema>;

// quantity moves only through InventoryTransaction entries (stock-in/usage), and
// site is fixed at creation — neither is editable via a direct item update.
export const UpdateInventoryItemRequestSchema = CreateInventoryItemRequestSchema.omit({
  site: true,
  quantity: true,
}).partial();
export type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemRequestSchema>;

export const ListInventoryItemsQuerySchema = z.object({
  site: objectIdSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListInventoryItemsQuery = z.infer<typeof ListInventoryItemsQuerySchema>;
