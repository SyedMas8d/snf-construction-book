import { Schema, model, InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'admin', 'engineer'], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedSites: [{ type: Schema.Types.ObjectId, ref: 'Site' }],
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = model('User', userSchema);
