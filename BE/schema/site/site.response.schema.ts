import { z } from 'zod';
import { SiteStatusEnum } from './site.request.schema';
import { objectIdSchema } from '../../utils/objectId.schema';

export const SiteResponseSchema = z.object({
  _id: objectIdSchema,
  name: z.string(),
  address: z.string(),
  client: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  estimatedCost: z.number().optional(),
  notes: z.string().optional(),
  status: SiteStatusEnum,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type SiteResponse = z.infer<typeof SiteResponseSchema>;

export const SiteListResponseSchema = z.array(SiteResponseSchema);
