import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  const existing = req.header('x-request-id');
  const requestId = existing ?? randomUUID();
  req.requestId = requestId;
  _res.setHeader('x-request-id', requestId);
  next();
}
