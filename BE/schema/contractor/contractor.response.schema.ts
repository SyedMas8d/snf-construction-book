import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

export const ContractorResponseSchema = z.object({
  _id: objectIdSchema,
  site: objectIdSchema,
  name: z.string(),
  phone: z.string().optional(),
  workerTypes: z.array(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ContractorResponse = z.infer<typeof ContractorResponseSchema>;

export const ContractorListResponseSchema = z.array(ContractorResponseSchema);
