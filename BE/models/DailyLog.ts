import { Schema, model, InferSchemaType } from 'mongoose';

const dailyLogSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    contractor: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true },
    workLog: { type: Schema.Types.ObjectId, ref: 'WorkLog' },
    date: { type: Date, required: true },
    workerType: { type: String, required: true, trim: true },
    count: { type: Number, required: true, min: 1 },
    paid: { type: Boolean, default: false },
    weather: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export type DailyLog = InferSchemaType<typeof dailyLogSchema>;

export const DailyLogModel = model('DailyLog', dailyLogSchema);
