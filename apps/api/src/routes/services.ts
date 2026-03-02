import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { exhibitionScope } from '../middleware/exhibitionScope.js';
import { cacheMiddleware } from '../cache/cacheMiddleware.js';
import { CacheKeys, CacheTTL } from '../cache/cacheKeys.js';
import { invalidateServices } from '../cache/invalidation.js';

const router = Router();

router.get(
  '/',
  exhibitionScope,
  cacheMiddleware((req) => CacheKeys.services(req.exhibitionId!), CacheTTL.LONG),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM services WHERE exhibition_id = $1 ORDER BY name',
        [req.exhibitionId],
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
);

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      exhibition_id, name, category, description,
      price, quantity, sold_quantity, is_unlimited, notes,
    } = req.body;

    if (!exhibition_id) throw new AppError(400, 'exhibition_id is required');
    if (!name?.trim()) throw new AppError(400, 'Service name is required');
    if (price < 0) throw new AppError(400, 'Service price cannot be negative');
    if (quantity < 0) throw new AppError(400, 'Service quantity cannot be negative');

    const { rows } = await pool.query(
      `INSERT INTO services (
        exhibition_id, name, category, description,
        price, quantity, sold_quantity, is_unlimited, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        exhibition_id, name, category || 'add_on', description || null,
        price ?? 0, quantity ?? 0, sold_quantity ?? 0, is_unlimited ?? false, notes || null,
      ],
    );

    await invalidateServices(exhibition_id);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, quantity, sold_quantity, is_unlimited, notes } = req.body;

    if (price !== undefined && price < 0) throw new AppError(400, 'Service price cannot be negative');
    if (quantity !== undefined && quantity < 0) throw new AppError(400, 'Service quantity cannot be negative');
    if (sold_quantity !== undefined && sold_quantity < 0) throw new AppError(400, 'Sold quantity cannot be negative');

    const { rows } = await pool.query(
      `UPDATE services SET
        name          = COALESCE($1, name),
        category      = COALESCE($2, category),
        description   = COALESCE($3, description),
        price         = COALESCE($4, price),
        quantity      = COALESCE($5, quantity),
        sold_quantity = COALESCE($6, sold_quantity),
        is_unlimited  = COALESCE($7, is_unlimited),
        notes         = COALESCE($8, notes),
        updated_at    = NOW()
      WHERE id = $9
      RETURNING *`,
      [
        name ?? null, category ?? null, description ?? null,
        price ?? null, quantity ?? null, sold_quantity ?? null, is_unlimited ?? null,
        notes ?? null, id,
      ],
    );

    if (rows.length === 0) throw new AppError(404, 'Service not found');

    await invalidateServices(rows[0].exhibition_id);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rows: allocs } = await pool.query(
      'SELECT id FROM service_allocations WHERE service_id = $1 LIMIT 1',
      [id],
    );
    if (allocs.length > 0) {
      throw new AppError(409, 'Cannot delete service with existing allocations. Remove allocations first.');
    }

    const { rows } = await pool.query(
      'DELETE FROM services WHERE id = $1 RETURNING exhibition_id',
      [id],
    );
    if (rows.length === 0) throw new AppError(404, 'Service not found');

    await invalidateServices(rows[0].exhibition_id);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
