import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';
import { Role } from '../utils/jwt';

export function requireRole(role: Role | Role[]) {
  const allowed = Array.isArray(role) ? role : [role];
  return function (req: Request, _res: Response, next: NextFunction) {
    if (!req.user || !allowed.includes(req.user.role)) {
      return next(new HttpError(403, `Requires ${allowed.join(' or ')} role`));
    }
    next();
  };
}
