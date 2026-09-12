import { Schema, model, InferSchemaType } from 'mongoose';

const workLogSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    contractor: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export type WorkLog = InferSchemaType<typeof workLogSchema>;

export const WorkLogModel = model('WorkLog', workLogSchema);
