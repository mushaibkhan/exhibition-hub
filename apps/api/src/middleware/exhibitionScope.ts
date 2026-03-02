import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

declare global {
  namespace Express {
    interface Request {
      exhibitionId?: string;
    }
  }
}

export function exhibitionScope(req: Request, _res: Response, next: NextFunction) {
  const exhibitionId = req.query.exhibition_id as string | undefined
    || req.body?.exhibition_id as string | undefined;

  if (!exhibitionId) {
    return next(new AppError(400, 'exhibition_id is required'));
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(exhibitionId)) {
    return next(new AppError(400, 'exhibition_id must be a valid UUID'));
  }

  req.exhibitionId = exhibitionId;
  next();
}

export function optionalExhibitionScope(req: Request, _res: Response, next: NextFunction) {
  const exhibitionId = req.query.exhibition_id as string | undefined
    || req.body?.exhibition_id as string | undefined;

  if (exhibitionId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(exhibitionId)) {
      return next(new AppError(400, 'exhibition_id must be a valid UUID'));
    }
    req.exhibitionId = exhibitionId;
  }

  next();
}
