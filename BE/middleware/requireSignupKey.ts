import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { HttpError } from '../utils/httpError';
import { signupKeyRepo } from '../repositories/signupKey.repo';

export async function requireSignupKey(req: Request, _res: Response, next: NextFunction) {
  const provided = req.header('x-api-key');
  if (!provided) {
    return next(new HttpError(401, 'Missing x-api-key header'));
  }
  const stored = await signupKeyRepo.get();
  if (!stored) {
    return next(new HttpError(503, 'Signup is not configured'));
  }
  const matches = await bcrypt.compare(provided, stored.keyHash);
  if (!matches) {
    return next(new HttpError(401, 'Invalid API key'));
  }
  next();
}
