import { z } from 'zod';
import { InventoryTransactionTypeEnum } from './inventoryTransaction.request.schema';
import { objectIdSchema } from '../../utils/objectId.schema';

export const InventoryTransactionResponseSchema = z.object({
  _id: objectIdSchema,
  site: objectIdSchema,
  item: objectIdSchema,
  type: InventoryTransactionTypeEnum,
  quantity: z.number(),
  date: z.coerce.date(),
  previousQuantity: z.number(),
  newQuantity: z.number(),
  note: z.string().optional(),
  recordedBy: objectIdSchema.optional(),
  recordedByName: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type InventoryTransactionResponse = z.infer<typeof InventoryTransactionResponseSchema>;

export const InventoryTransactionListResponseSchema = z.array(InventoryTransactionResponseSchema);
