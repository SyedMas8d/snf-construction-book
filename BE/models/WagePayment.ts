import { Schema, model, InferSchemaType } from 'mongoose';

const wagePaymentSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    contractor: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true },
    workerType: { type: String, required: true, trim: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export type WagePayment = InferSchemaType<typeof wagePaymentSchema>;

export const WagePaymentModel = model('WagePayment', wagePaymentSchema);
