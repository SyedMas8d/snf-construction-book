import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

export const UserResponseSchema = z.object({
  _id: objectIdSchema,
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(['super_admin', 'admin', 'engineer']),
  assignedSites: z.array(objectIdSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

export const UserListResponseSchema = z.array(UserResponseSchema);

// Returned only once, from the create-engineer call — the plaintext password is never
// stored or retrievable again after this response.
export const CreateEngineerResponseSchema = UserResponseSchema.extend({
  temporaryPassword: z.string(),
});
export type CreateEngineerResponse = z.infer<typeof CreateEngineerResponseSchema>;

// Admin rows also carry their own enterprise (name/address) so the super_admin's
// list can show which company each admin represents without a second round trip.
export const AdminResponseSchema = UserResponseSchema.extend({
  enterprise: z.object({ name: z.string(), address: z.string() }),
});
export type AdminResponse = z.infer<typeof AdminResponseSchema>;

export const CreateAdminResponseSchema = AdminResponseSchema.extend({
  temporaryPassword: z.string(),
});
export type CreateAdminResponse = z.infer<typeof CreateAdminResponseSchema>;

export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  });
}

export const PaginatedUserListResponseSchema = paginatedResponseSchema(UserResponseSchema);
export const PaginatedAdminListResponseSchema = paginatedResponseSchema(AdminResponseSchema);

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: UserResponseSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
