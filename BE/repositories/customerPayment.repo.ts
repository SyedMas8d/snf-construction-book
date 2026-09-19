import { CustomerPaymentModel } from '../models/CustomerPayment';
import { createDoc, findAllDocs } from '../db/dbOpHelpers';

export const customerPaymentRepo = {
  create: (data: { site: string; amount: number; date: Date; note?: string; createdBy: string }) =>
    createDoc(CustomerPaymentModel, data),

  findAllForSite: (site: string) => findAllDocs(CustomerPaymentModel, { site }),

  deleteForSite: (site: string, id: string) => CustomerPaymentModel.findOneAndDelete({ _id: id, site }),

  async sumForSite(site: string): Promise<number> {
    const payments = await CustomerPaymentModel.find({ site });
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  },
};
