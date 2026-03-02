import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';

export function cacheMiddleware(keyFn: (req: Request) => string, ttl: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyFn(req);
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = ((data: any) => {
        redis.setex(key, ttl, JSON.stringify(data)).catch(() => {});
        return originalJson(data);
      }) as any;

      next();
    } catch {
      next();
    }
  };
}
