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
        'SELECT * FROM payments WHERE exhibition_id = $1 ORDER BY payment_date DESC',
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
      exhibition_id, transaction_id, amount, payment_mode,
      account_id, reference_id, payment_date, recorded_by, notes,
    } = req.body;

    if (!exhibition_id) throw new AppError(400, 'exhibition_id is required');
    if (!transaction_id) throw new AppError(400, 'transaction_id is required');
    if (!amount || amount <= 0) throw new AppError(400, 'Payment amount must be greater than zero');

    // Validate against transaction total
    const { rows: txnRows } = await pool.query(
      'SELECT total_amount, cancelled FROM transactions WHERE id = $1',
      [transaction_id],
    );
    if (txnRows.length === 0) throw new AppError(404, 'Transaction not found');
    if (txnRows[0].cancelled) throw new AppError(400, 'Cannot add payment to cancelled transaction');

    const totalAmount = Number(txnRows[0].total_amount);

    const { rows: existingPayments } = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS paid FROM payments WHERE transaction_id = $1',
      [transaction_id],
    );
    const currentPaid = Number(existingPayments[0].paid);
    const pendingAmount = totalAmount - currentPaid;

    if (Number(amount) > pendingAmount) {
      throw new AppError(400, `Payment exceeds pending amount. Maximum: ${pendingAmount}`);
    }

    // Normalise payment_date to YYYY-MM-DD
    let normDate = payment_date || new Date().toISOString().split('T')[0];
    if (normDate.includes('T')) normDate = normDate.split('T')[0];

    const { rows } = await pool.query(
      `INSERT INTO payments (
        exhibition_id, transaction_id, amount, payment_mode,
        account_id, reference_id, payment_date, recorded_by, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        exhibition_id, transaction_id, Number(amount), payment_mode || 'cash',
        account_id || null, reference_id || null, normDate, recorded_by || null, notes || null,
      ],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query('DELETE FROM payments WHERE id = $1', [id]);
    if (rowCount === 0) throw new AppError(404, 'Payment not found');

    res.json({ message: 'Payment deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
