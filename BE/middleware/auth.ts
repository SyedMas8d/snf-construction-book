import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';
import { verifyToken } from '../utils/jwt';
import { userRepo } from '../repositories/user.repo';
import { Role } from '../utils/jwt';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Missing Authorization header'));
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyToken(token);
    const user = await userRepo.findById(payload.id);
    if (!user) {
      return next(new HttpError(401, 'Invalid or expired token'));
    }
    req.user = {
      id: user._id.toString(),
      role: user.role as Role,
      assignedSites: (user.assignedSites ?? []).map((id) => id.toString()),
    };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}
