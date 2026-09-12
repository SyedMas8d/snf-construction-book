import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';
import { dateOnlySchema } from '../../utils/dateOnly.schema';
import { daysBetween, MAX_DATE_RANGE_DAYS, todayDateOnly } from '../../utils/dateRange';

export const CreateWorkLogRequestSchema = z
  .object({
    site: objectIdSchema,
    contractor: objectIdSchema,
    from: dateOnlySchema,
    to: dateOnlySchema,
  })
  .refine((data) => data.from <= data.to, { message: 'from must be on or before to', path: ['from'] });
export type CreateWorkLogInput = z.infer<typeof CreateWorkLogRequestSchema>;

export const UpdateWorkLogRequestSchema = z
  .object({
    from: dateOnlySchema,
    to: dateOnlySchema,
  })
  .refine((data) => data.from <= data.to, { message: 'from must be on or before to', path: ['from'] });
export type UpdateWorkLogInput = z.infer<typeof UpdateWorkLogRequestSchema>;

export const WorkLogOverlapsQuerySchema = z
  .object({
    site: objectIdSchema,
    // Comma-separated contractor ids — kept as a single query param rather than
    // contractor[] repetition, since that's simpler to build from the client's
    // already-selected chip list.
    contractors: z
      .string()
      .trim()
      .min(1)
      .transform((value) => value.split(',').map((id) => id.trim()))
      .pipe(z.array(objectIdSchema).min(1)),
    from: dateOnlySchema,
    to: dateOnlySchema,
  })
  .refine((data) => data.from <= data.to, { message: 'from must be on or before to', path: ['from'] });
export type WorkLogOverlapsQuery = z.infer<typeof WorkLogOverlapsQuerySchema>;

export const WorkLogBucketEnum = z.enum(['current', 'upcoming', 'previous']);
export type WorkLogBucket = z.infer<typeof WorkLogBucketEnum>;

export const ListWorkLogsQuerySchema = z
  .object({
    site: objectIdSchema.optional(),
    contractor: objectIdSchema.optional(),
    bucket: WorkLogBucketEnum.optional(),
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  // Only the "upcoming" search is allowed to reach into the future — everywhere
  // else a future `to` would just mean an empty tail with no matching data.
  .refine((data) => data.bucket === 'upcoming' || !data.to || data.to <= todayDateOnly(), {
    message: 'to cannot be in the future',
    path: ['to'],
  })
  .refine((data) => !data.from || !data.to || daysBetween(data.from, data.to) <= MAX_DATE_RANGE_DAYS, {
    message: `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days`,
    path: ['to'],
  });
export type ListWorkLogsQuery = z.infer<typeof ListWorkLogsQuerySchema>;
