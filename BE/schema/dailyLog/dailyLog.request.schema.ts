import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

export const CreateDailyLogRequestSchema = z.object({
  site: objectIdSchema,
  contractor: objectIdSchema,
  workLog: objectIdSchema,
  date: z.coerce.date(),
  workerType: z.string().trim().min(1),
  count: z.coerce.number().int().min(1),
  weather: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type CreateDailyLogInput = z.infer<typeof CreateDailyLogRequestSchema>;

export const UpdateDailyLogRequestSchema = CreateDailyLogRequestSchema.partial();
export type UpdateDailyLogInput = z.infer<typeof UpdateDailyLogRequestSchema>;
