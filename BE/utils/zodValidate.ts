import { ZodType, z } from 'zod';
import { HttpError } from './httpError';

function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ');
}

export function validateRequest<T extends ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(422, formatIssues(result.error));
  }
  return result.data;
}

export function validateResponse<T extends ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Response validation failed: ${formatIssues(result.error)}`);
  }
  return result.data;
}
