import { z } from 'zod';

export const SiteStatusEnum = z.enum(['planned', 'active', 'completed', 'on-hold']);

export const CreateSiteRequestSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  client: z.string().trim().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  status: SiteStatusEnum.optional(),
});
export type CreateSiteInput = z.infer<typeof CreateSiteRequestSchema>;

export const UpdateSiteRequestSchema = CreateSiteRequestSchema.partial();
export type UpdateSiteInput = z.infer<typeof UpdateSiteRequestSchema>;
