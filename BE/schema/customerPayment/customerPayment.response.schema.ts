import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

export const CustomerPaymentResponseSchema = z.object({
  _id: objectIdSchema,
  site: objectIdSchema,
  amount: z.number(),
  date: z.coerce.date(),
  note: z.string().optional(),
  createdBy: objectIdSchema.optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type CustomerPaymentResponse = z.infer<typeof CustomerPaymentResponseSchema>;

export const CustomerPaymentListResponseSchema = z.array(CustomerPaymentResponseSchema);
