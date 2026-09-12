import { z } from 'zod';

export const EnterpriseSettingsResponseSchema = z.object({
  name: z.string(),
  address: z.string(),
});
export type EnterpriseSettingsResponse = z.infer<typeof EnterpriseSettingsResponseSchema>;
