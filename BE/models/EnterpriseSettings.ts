import { Schema, model, InferSchemaType } from 'mongoose';

const enterpriseSettingsSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export type EnterpriseSettings = InferSchemaType<typeof enterpriseSettingsSchema>;

export const EnterpriseSettingsModel = model('EnterpriseSettings', enterpriseSettingsSchema);
