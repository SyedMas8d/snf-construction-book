import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

export const DashboardResponseSchema = z.object({
  range: z.object({ from: z.string(), to: z.string() }),
  wages: z.object({
    totalWorkerCount: z.number(),
    unpaidWorkerCount: z.number(),
    entryCount: z.number(),
  }),
  inventory: z.object({
    totalStockIn: z.number(),
    totalUsage: z.number(),
    byItem: z.array(
      z.object({
        itemId: objectIdSchema,
        name: z.string(),
        unit: z.string(),
        stockIn: z.number(),
        usage: z.number(),
        balanceStock: z.number(),
      })
    ),
  }),
});
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
