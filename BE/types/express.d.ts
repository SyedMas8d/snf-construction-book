import { Role } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; assignedSites: string[] };
    }
  }
}

export {};
