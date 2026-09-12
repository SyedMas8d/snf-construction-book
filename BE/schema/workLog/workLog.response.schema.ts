import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

export const WorkLogResponseSchema = z.object({
  _id: objectIdSchema,
  site: objectIdSchema,
  contractor: objectIdSchema,
  contractorName: z.string(),
  from: z.coerce.date(),
  to: z.coerce.date(),
  createdBy: objectIdSchema.optional(),
  createdByName: z.string().optional(),
  entryCount: z.number(),
  totalWorkerCount: z.number(),
  fullyPaid: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type WorkLogResponse = z.infer<typeof WorkLogResponseSchema>;

export const WorkLogListResponseSchema = z.array(WorkLogResponseSchema);

export const PaginatedWorkLogListResponseSchema = z.object({
  items: z.array(WorkLogResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type PaginatedWorkLogListResponse = z.infer<typeof PaginatedWorkLogListResponseSchema>;

export const WorkLogOverlapSchema = z.object({
  contractorId: objectIdSchema,
  contractorName: z.string(),
  ranges: z.array(z.object({ from: z.string(), to: z.string() })),
});
export type WorkLogOverlap = z.infer<typeof WorkLogOverlapSchema>;

export const WorkLogOverlapsResponseSchema = z.array(WorkLogOverlapSchema);
