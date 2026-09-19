import { customerPaymentRepo } from '../repositories/customerPayment.repo';
import { CreateCustomerPaymentInput } from '../schema/customerPayment/customerPayment.request.schema';
import { HttpError } from '../utils/httpError';

export const customerPaymentService = {
  create: (siteId: string, input: CreateCustomerPaymentInput, createdBy: string) =>
    customerPaymentRepo.create({
      site: siteId,
      amount: input.amount,
      date: input.date,
      note: input.note,
      createdBy,
    }),

  list: (siteId: string) => customerPaymentRepo.findAllForSite(siteId),

  async delete(siteId: string, id: string) {
    const deleted = await customerPaymentRepo.deleteForSite(siteId, id);
    if (!deleted) {
      throw new HttpError(404, 'Payment not found');
    }
  },

  sumForSite: (siteId: string) => customerPaymentRepo.sumForSite(siteId),
};
