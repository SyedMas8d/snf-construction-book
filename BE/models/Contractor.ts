import { Schema, model, InferSchemaType } from 'mongoose';

const contractorSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    workerTypes: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

export type Contractor = InferSchemaType<typeof contractorSchema>;

export const ContractorModel = model('Contractor', contractorSchema);
