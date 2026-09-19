import { z } from 'zod';

export const CreateCustomerPaymentRequestSchema = z.object({
  amount: z.coerce.number().min(0),
  date: z.coerce.date(),
  note: z.string().trim().optional(),
});
export type CreateCustomerPaymentInput = z.infer<typeof CreateCustomerPaymentRequestSchema>;
