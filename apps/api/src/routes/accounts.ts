import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheMiddleware } from '../cache/cacheMiddleware.js';
import { CacheKeys, CacheTTL } from '../cache/cacheKeys.js';
import { invalidateAccounts } from '../cache/invalidation.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get(
  '/',
  cacheMiddleware(() => CacheKeys.accounts(), CacheTTL.LONG),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await pool.query('SELECT * FROM accounts ORDER BY name');
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
);

router.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, upi_details, bank_details, notes, is_active } = req.body;

    if (!name?.trim()) throw new AppError(400, 'Account name is required');

    const { rows } = await pool.query(
      `INSERT INTO accounts (name, upi_details, bank_details, notes, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, upi_details || null, bank_details || null, notes || null, is_active ?? true],
    );

    await invalidateAccounts();
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, upi_details, bank_details, notes, is_active } = req.body;

    if (name !== undefined && !name.trim()) {
      throw new AppError(400, 'Account name cannot be empty');
    }

    const { rows } = await pool.query(
      `UPDATE accounts SET
        name         = COALESCE($1, name),
        upi_details  = COALESCE($2, upi_details),
        bank_details = COALESCE($3, bank_details),
        notes        = COALESCE($4, notes),
        is_active    = COALESCE($5, is_active),
        updated_at   = NOW()
      WHERE id = $6
      RETURNING *`,
      [name ?? null, upi_details ?? null, bank_details ?? null, notes ?? null, is_active ?? null, id],
    );

    if (rows.length === 0) throw new AppError(404, 'Account not found');

    await invalidateAccounts();
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rows: paymentsUsing } = await pool.query(
      'SELECT id FROM payments WHERE account_id = $1 LIMIT 1',
      [id],
    );
    if (paymentsUsing.length > 0) {
      throw new AppError(409, 'Cannot delete account that is used in payments. Deactivate it instead.');
    }

    const { rowCount } = await pool.query('DELETE FROM accounts WHERE id = $1', [id]);
    if (rowCount === 0) throw new AppError(404, 'Account not found');

    await invalidateAccounts();
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
