import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { exhibitionScope } from '../middleware/exhibitionScope.js';

const router = Router();

router.get(
  '/',
  exhibitionScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, exhibition_id, name, created_at FROM expense_categories WHERE exhibition_id = $1 ORDER BY name',
        [req.exhibitionId],
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/',
  exhibitionScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exhibitionId = req.exhibitionId!;
      const { name } = req.body;
      const trimmed = typeof name === 'string' ? name.trim() : '';
      if (!trimmed) throw new AppError(400, 'Category name is required');

      const { rows } = await pool.query(
        `INSERT INTO expense_categories (exhibition_id, name) VALUES ($1, $2)
         ON CONFLICT (exhibition_id, name) DO UPDATE SET exhibition_id = expense_categories.exhibition_id
         RETURNING id, exhibition_id, name, created_at`,
        [exhibitionId, trimmed],
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
