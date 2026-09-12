import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';
import { dateOnlySchema } from '../../utils/dateOnly.schema';
import { daysBetween, MAX_DATE_RANGE_DAYS, todayDateOnly } from '../../utils/dateRange';

export const WageSummaryQuerySchema = z
  .object({
    site: objectIdSchema,
    from: dateOnlySchema,
    to: dateOnlySchema,
  })
  .refine((data) => data.from <= data.to, { message: 'from must be on or before to', path: ['from'] })
  .refine((data) => data.to <= todayDateOnly(), { message: 'to cannot be in the future', path: ['to'] })
  .refine((data) => daysBetween(data.from, data.to) <= MAX_DATE_RANGE_DAYS, {
    message: `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days`,
    path: ['to'],
  });
export type WageSummaryQuery = z.infer<typeof WageSummaryQuerySchema>;

export const SiteOnlyQuerySchema = z.object({
  site: objectIdSchema,
});
export type SiteOnlyQuery = z.infer<typeof SiteOnlyQuerySchema>;

export const RecentPaidQuerySchema = z
  .object({
    site: objectIdSchema,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
  })
  .refine((data) => !data.to || data.to <= todayDateOnly(), {
    message: 'to cannot be in the future',
    path: ['to'],
  })
  .refine((data) => !data.from || !data.to || daysBetween(data.from, data.to) <= MAX_DATE_RANGE_DAYS, {
    message: `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days`,
    path: ['to'],
  });
export type RecentPaidQuery = z.infer<typeof RecentPaidQuerySchema>;

const MAX_PAYSHEET_RANGE_DAYS = 7;

export const WagePaysheetQuerySchema = z
  .object({
    site: objectIdSchema,
    from: dateOnlySchema,
    to: dateOnlySchema,
    contractor: objectIdSchema.optional(),
  })
  .refine((data) => data.from <= data.to, { message: 'from must be on or before to', path: ['from'] })
  .refine((data) => daysBetween(data.from, data.to) <= MAX_PAYSHEET_RANGE_DAYS, {
    message: `Pay slip range cannot exceed ${MAX_PAYSHEET_RANGE_DAYS} days`,
    path: ['to'],
  });
export type WagePaysheetQuery = z.infer<typeof WagePaysheetQuerySchema>;

export const MarkWagesPaidRequestSchema = z.object({
  site: objectIdSchema,
  contractor: objectIdSchema,
  workerType: z.string().trim().min(1),
  from: dateOnlySchema,
  to: dateOnlySchema,
  amount: z.coerce.number().min(0),
});
export type MarkWagesPaidInput = z.infer<typeof MarkWagesPaidRequestSchema>;

export const MarkWagesUnpaidRequestSchema = z.object({
  site: objectIdSchema,
  contractor: objectIdSchema,
  workerType: z.string().trim().min(1),
  from: dateOnlySchema,
  to: dateOnlySchema,
});
export type MarkWagesUnpaidInput = z.infer<typeof MarkWagesUnpaidRequestSchema>;
