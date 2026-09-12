import { NextFunction, Request, Response } from 'express';
import { connectToDatabase } from '../db/connect';

export async function ensureDbConnected(_req: Request, _res: Response, next: NextFunction) {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    next(err);
  }
}
