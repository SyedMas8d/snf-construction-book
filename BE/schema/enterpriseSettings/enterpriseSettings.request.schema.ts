import { z } from 'zod';

export const UpdateEnterpriseSettingsRequestSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
});
export type UpdateEnterpriseSettingsInput = z.infer<typeof UpdateEnterpriseSettingsRequestSchema>;
