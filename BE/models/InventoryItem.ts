import { Schema, model, InferSchemaType } from 'mongoose';

const inventoryItemSchema = new Schema(
  {
    site: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['material', 'tool', 'equipment'],
      required: true,
    },
    unit: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    minThreshold: { type: Number, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export type InventoryItem = InferSchemaType<typeof inventoryItemSchema>;

export const InventoryItemModel = model('InventoryItem', inventoryItemSchema);
