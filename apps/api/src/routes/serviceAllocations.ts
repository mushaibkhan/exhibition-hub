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
        'SELECT * FROM service_allocations WHERE exhibition_id = $1',
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
    const { exhibition_id, service_id, stall_id, transaction_id, quantity } = req.body;

    if (!exhibition_id) throw new AppError(400, 'exhibition_id is required');
    if (!service_id) throw new AppError(400, 'service_id is required');
    if (!stall_id) throw new AppError(400, 'stall_id is required');
    if (!transaction_id) throw new AppError(400, 'transaction_id is required');
    if (!quantity || quantity < 1) throw new AppError(400, 'Quantity must be at least 1');

    const { rows } = await pool.query(
      `INSERT INTO service_allocations (exhibition_id, service_id, stall_id, transaction_id, quantity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [exhibition_id, service_id, stall_id, transaction_id, quantity],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query('DELETE FROM service_allocations WHERE id = $1', [id]);
    if (rowCount === 0) throw new AppError(404, 'Service allocation not found');

    res.json({ message: 'Service allocation deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
