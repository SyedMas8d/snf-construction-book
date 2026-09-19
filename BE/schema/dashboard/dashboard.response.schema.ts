import { z } from 'zod';

export const DashboardResponseSchema = z.object({
  estimatedCost: z.number().optional(),
  notes: z.string().optional(),
  totalReceived: z.number(),
  totalWagesPaid: z.number(),
  totalMaterialSpend: z.number(),
});
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
