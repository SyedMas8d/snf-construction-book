import { z } from 'zod';

export const InventoryTransactionTypeEnum = z.enum(['stock-in', 'usage']);

export const CreateInventoryTransactionRequestSchema = z.object({
  type: InventoryTransactionTypeEnum,
  quantity: z.coerce.number().positive(),
  date: z.coerce.date(),
  amount: z.coerce.number().min(0).optional(),
  note: z.string().trim().optional(),
});
export type CreateInventoryTransactionInput = z.infer<typeof CreateInventoryTransactionRequestSchema>;

export const UpdateInventoryTransactionAmountRequestSchema = z.object({
  amount: z.coerce.number().min(0),
});
export type UpdateInventoryTransactionAmountInput = z.infer<typeof UpdateInventoryTransactionAmountRequestSchema>;
