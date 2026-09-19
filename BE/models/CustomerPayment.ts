import { Schema, model, InferSchemaType } from 'mongoose';

const customerPaymentSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export type CustomerPayment = InferSchemaType<typeof customerPaymentSchema>;

export const CustomerPaymentModel = model('CustomerPayment', customerPaymentSchema);
