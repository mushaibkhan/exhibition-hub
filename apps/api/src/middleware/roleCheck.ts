import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

declare global {
  namespace Express {
    interface Request {
      userRole?: string;
    }
  }
}

export function roleCheck(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.headers['x-user-role'] as string | undefined;
    req.userRole = role || 'admin';

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.userRole)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
}
