import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

const LedgerDaySchema = z.object({
  date: z.string(),
  stockIn: z.number(),
  usage: z.number(),
  balance: z.number(),
});

export const InventoryLedgerResponseSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }),
  items: z.array(
    z.object({
      itemId: objectIdSchema,
      name: z.string(),
      unit: z.string(),
      openingBalance: z.number(),
      closingBalance: z.number(),
      days: z.array(LedgerDaySchema),
    })
  ),
});
export type InventoryLedgerResponse = z.infer<typeof InventoryLedgerResponseSchema>;
