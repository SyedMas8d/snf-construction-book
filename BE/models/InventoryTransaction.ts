import { Schema, model, InferSchemaType } from 'mongoose';

const inventoryTransactionSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    item: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    type: { type: String, enum: ['stock-in', 'usage'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    note: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export type InventoryTransaction = InferSchemaType<typeof inventoryTransactionSchema>;

export const InventoryTransactionModel = model('InventoryTransaction', inventoryTransactionSchema);
