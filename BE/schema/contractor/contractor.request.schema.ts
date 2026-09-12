import { z } from 'zod';
import { objectIdSchema } from '../../utils/objectId.schema';

export const CreateContractorRequestSchema = z.object({
  site: objectIdSchema,
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1).optional(),
  workerTypes: z.array(z.string().trim().min(1)).default([]),
});
export type CreateContractorInput = z.infer<typeof CreateContractorRequestSchema>;

export const UpdateContractorRequestSchema = CreateContractorRequestSchema.omit({ site: true }).partial();
export type UpdateContractorInput = z.infer<typeof UpdateContractorRequestSchema>;
