import { Schema, model, InferSchemaType } from 'mongoose';

const siteSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    client: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    estimatedCost: { type: Number, min: 0 },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['planned', 'active', 'completed', 'on-hold'],
      default: 'planned',
    },
  },
  { timestamps: true }
);

export type Site = InferSchemaType<typeof siteSchema>;

export const SiteModel = model('Site', siteSchema);
