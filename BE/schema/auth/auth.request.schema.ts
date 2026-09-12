import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

const credentialsFields = {
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(1),
  password: z.string().min(6),
};

export const SignupRequestSchema = z.object(credentialsFields);
export type SignupInput = z.infer<typeof SignupRequestSchema>;

// No password field here — engineer accounts get a random temporary password
// generated server-side (see authService.createEngineer), never admin-typed.
export const CreateEngineerRequestSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(1),
  assignedSites: z.array(objectIdSchema).default([]),
});
export type CreateEngineerInput = z.infer<typeof CreateEngineerRequestSchema>;

// No password field here either — admin accounts also get a random temporary password
// generated server-side (see authService.createAdmin), set by the super_admin who onboards them.
export const CreateAdminRequestSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(1),
  enterpriseName: z.string().trim().min(1),
  enterpriseAddress: z.string().trim().min(1),
});
export type CreateAdminInput = z.infer<typeof CreateAdminRequestSchema>;

export const PaginatedListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});
export type PaginatedListQuery = z.infer<typeof PaginatedListQuerySchema>;

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordRequestSchema>;

export const UpdateEngineerSitesRequestSchema = z.object({
  assignedSites: z.array(objectIdSchema),
});
export type UpdateEngineerSitesInput = z.infer<typeof UpdateEngineerSitesRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginRequestSchema>;
