import { z } from 'zod';

export const InventoryTransactionTypeEnum = z.enum(['stock-in', 'usage']);

export const CreateInventoryTransactionRequestSchema = z.object({
  type: InventoryTransactionTypeEnum,
  quantity: z.coerce.number().positive(),
  date: z.coerce.date(),
  note: z.string().trim().optional(),
});
export type CreateInventoryTransactionInput = z.infer<typeof CreateInventoryTransactionRequestSchema>;
