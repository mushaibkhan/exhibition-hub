import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheMiddleware } from '../cache/cacheMiddleware.js';
import { CacheKeys, CacheTTL } from '../cache/cacheKeys.js';
import { invalidateExhibitions } from '../cache/invalidation.js';

const router = Router();

router.get(
  '/',
  cacheMiddleware(() => CacheKeys.exhibitions(), CacheTTL.LONG),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM exhibitions ORDER BY start_date',
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
);

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, short_name, description, start_date, end_date } = req.body;

    if (!name?.trim()) throw new AppError(400, 'Exhibition name is required');
    if (!short_name?.trim()) throw new AppError(400, 'Short name is required');
    if (!start_date) throw new AppError(400, 'Start date is required');
    if (!end_date) throw new AppError(400, 'End date is required');
    if (new Date(start_date) > new Date(end_date)) {
      throw new AppError(400, 'End date must be after start date');
    }

    const { rows } = await pool.query(
      `INSERT INTO exhibitions (name, short_name, description, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, short_name, description || null, start_date, end_date],
    );

    await invalidateExhibitions();
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, short_name, description, start_date, end_date } = req.body;

    if (name !== undefined && !name.trim()) {
      throw new AppError(400, 'Exhibition name cannot be empty');
    }
    if (short_name !== undefined && !short_name.trim()) {
      throw new AppError(400, 'Short name cannot be empty');
    }
    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      throw new AppError(400, 'End date must be after start date');
    }

    const { rows } = await pool.query(
      `UPDATE exhibitions
       SET name        = COALESCE($1, name),
           short_name  = COALESCE($2, short_name),
           description = COALESCE($3, description),
           start_date  = COALESCE($4, start_date),
           end_date    = COALESCE($5, end_date),
           updated_at  = NOW()
       WHERE id = $6
       RETURNING *`,
      [name ?? null, short_name ?? null, description ?? null, start_date ?? null, end_date ?? null, id],
    );

    if (rows.length === 0) throw new AppError(404, 'Exhibition not found');

    await invalidateExhibitions();
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rows: stalls } = await pool.query(
      'SELECT id FROM stalls WHERE exhibition_id = $1 LIMIT 1',
      [id],
    );
    if (stalls.length > 0) {
      throw new AppError(409, 'Cannot delete exhibition that has stalls. Delete all stalls first.');
    }

    const { rowCount } = await pool.query('DELETE FROM exhibitions WHERE id = $1', [id]);
    if (rowCount === 0) throw new AppError(404, 'Exhibition not found');

    await invalidateExhibitions();
    res.json({ message: 'Exhibition deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
