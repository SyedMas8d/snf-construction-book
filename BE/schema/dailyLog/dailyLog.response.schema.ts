import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

export const DailyLogResponseSchema = z.object({
  _id: objectIdSchema,
  site: objectIdSchema,
  contractor: objectIdSchema,
  workLog: objectIdSchema.optional(),
  date: z.coerce.date(),
  workerType: z.string(),
  count: z.number(),
  paid: z.boolean(),
  weather: z.string().optional(),
  notes: z.string().optional(),
  createdBy: objectIdSchema.optional(),
  createdByName: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type DailyLogResponse = z.infer<typeof DailyLogResponseSchema>;

export const DailyLogListResponseSchema = z.array(DailyLogResponseSchema);
