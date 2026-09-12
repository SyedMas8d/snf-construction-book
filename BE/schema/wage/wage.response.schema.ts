import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

export const WageSummaryRowSchema = z.object({
  contractorId: objectIdSchema,
  contractorName: z.string(),
  workerType: z.string(),
  daysWorked: z.number(),
  totalWorkerCount: z.number(),
  unpaidDays: z.number(),
  unpaidWorkerCount: z.number(),
  paidAmount: z.number(),
});
export type WageSummaryRow = z.infer<typeof WageSummaryRowSchema>;

export const WageSummaryListResponseSchema = z.array(WageSummaryRowSchema);

export const WorkLogPayableRowSchema = z.object({
  workerType: z.string(),
  totalWorkerCount: z.number(),
  unpaidWorkerCount: z.number(),
  paidAmount: z.number(),
});

export const WorkLogPayableSchema = z.object({
  workLogId: objectIdSchema,
  contractorId: objectIdSchema,
  contractorName: z.string(),
  from: z.string(),
  to: z.string(),
  rows: z.array(WorkLogPayableRowSchema),
});
export type WorkLogPayable = z.infer<typeof WorkLogPayableSchema>;

export const WorkLogPayableListResponseSchema = z.array(WorkLogPayableSchema);

export const RecentWagePaymentSchema = z.object({
  paymentId: objectIdSchema,
  contractorId: objectIdSchema,
  contractorName: z.string(),
  workerType: z.string(),
  from: z.string(),
  to: z.string(),
  amount: z.number(),
});
export type RecentWagePayment = z.infer<typeof RecentWagePaymentSchema>;

export const RecentWagePaymentListResponseSchema = z.array(RecentWagePaymentSchema);

export const PaginatedRecentWagePaymentListResponseSchema = z.object({
  items: z.array(RecentWagePaymentSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type PaginatedRecentWagePaymentListResponse = z.infer<typeof PaginatedRecentWagePaymentListResponseSchema>;
