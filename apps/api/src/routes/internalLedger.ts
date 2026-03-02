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
        'SELECT * FROM internal_ledger WHERE exhibition_id = $1 ORDER BY created_at DESC',
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
    const { exhibition_id, from_name, to_name, amount, description } = req.body;

    if (!exhibition_id) throw new AppError(400, 'exhibition_id is required');
    if (!from_name?.trim()) throw new AppError(400, 'From name is required');
    if (!to_name?.trim()) throw new AppError(400, 'To name is required');
    if (!amount || amount <= 0) throw new AppError(400, 'Amount must be greater than zero');

    const { rows } = await pool.query(
      `INSERT INTO internal_ledger (exhibition_id, from_name, to_name, amount, description, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [exhibition_id, from_name, to_name, Number(amount), description || null],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/settle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `UPDATE internal_ledger
       SET status = 'settled', settled_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id],
    );

    if (rows.length === 0) throw new AppError(404, 'Internal ledger entry not found');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
