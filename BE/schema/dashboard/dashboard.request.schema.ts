import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';
import { dateOnlySchema } from '../../utils/dateOnly.schema';
import { daysBetween, MAX_DATE_RANGE_DAYS, todayDateOnly } from '../../utils/dateRange';

const MAX_EXPORT_RANGE_DAYS = 30;

const DashboardBaseQuerySchema = z.object({
  site: objectIdSchema,
  from: dateOnlySchema,
  to: dateOnlySchema,
});

export const DashboardQuerySchema = DashboardBaseQuerySchema.refine((data) => data.from <= data.to, {
  message: 'from must be on or before to',
  path: ['from'],
})
  .refine((data) => data.to <= todayDateOnly(), {
    message: 'to cannot be in the future',
    path: ['to'],
  })
  .refine((data) => daysBetween(data.from, data.to) <= MAX_DATE_RANGE_DAYS, {
    message: `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days`,
    path: ['to'],
  });
export type DashboardQuery = z.infer<typeof DashboardQuerySchema>;

export const DashboardExportQuerySchema = DashboardBaseQuerySchema
  .refine((data) => data.from <= data.to, {
    message: 'from must be on or before to',
    path: ['from'],
  })
  .refine((data) => data.to <= todayDateOnly(), {
    message: 'to cannot be in the future',
    path: ['to'],
  })
  .refine((data) => daysBetween(data.from, data.to) <= MAX_EXPORT_RANGE_DAYS, {
    message: `Export range cannot exceed ${MAX_EXPORT_RANGE_DAYS} days`,
    path: ['to'],
  });
export type DashboardExportQuery = z.infer<typeof DashboardExportQuerySchema>;
