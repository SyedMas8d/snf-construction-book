import { Schema, model, InferSchemaType } from 'mongoose';

// Singleton document — the one secret an operator must present (via the x-api-key
// header) to call POST /auth/signup and create an admin account. There is no signup
// UI in the app; this is the only way to onboard a new admin.
const signupKeySchema = new Schema(
  {
    keyHash: { type: String, required: true },
  },
  { timestamps: true }
);

export type SignupKey = InferSchemaType<typeof signupKeySchema>;

export const SignupKeyModel = model('SignupKey', signupKeySchema);
