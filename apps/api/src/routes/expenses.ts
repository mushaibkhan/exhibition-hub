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
        'SELECT * FROM expenses WHERE exhibition_id = $1 ORDER BY expense_date DESC',
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
      exhibition_id, expense_date, category, description,
      amount, payment_mode, account_id, notes, created_by,
    } = req.body;

    if (!exhibition_id) throw new AppError(400, 'exhibition_id is required');
    if (!description?.trim()) throw new AppError(400, 'Description is required');
    if (!expense_date) throw new AppError(400, 'Expense date is required');
    if (!category) throw new AppError(400, 'Category is required');
    if (!payment_mode) throw new AppError(400, 'Payment mode is required');
    if (!amount || amount <= 0) throw new AppError(400, 'Expense amount must be greater than zero');

    let normDate = expense_date;
    if (normDate.includes('T')) normDate = normDate.split('T')[0];

    const { rows } = await pool.query(
      `INSERT INTO expenses (
        exhibition_id, expense_date, category, description,
        amount, payment_mode, account_id, notes, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        exhibition_id, normDate, category, description,
        Number(amount), payment_mode, account_id || null, notes || null, created_by || null,
      ],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { expense_date, category, description, amount, payment_mode, account_id, notes } = req.body;

    if (description !== undefined && !description.trim()) {
      throw new AppError(400, 'Description cannot be empty');
    }
    if (amount !== undefined && amount <= 0) {
      throw new AppError(400, 'Expense amount must be greater than zero');
    }

    let normDate = expense_date ?? null;
    if (normDate && normDate.includes('T')) normDate = normDate.split('T')[0];

    const { rows } = await pool.query(
      `UPDATE expenses SET
        expense_date = COALESCE($1, expense_date),
        category     = COALESCE($2, category),
        description  = COALESCE($3, description),
        amount       = COALESCE($4, amount),
        payment_mode = COALESCE($5, payment_mode),
        account_id   = COALESCE($6, account_id),
        notes        = COALESCE($7, notes),
        updated_at   = NOW()
      WHERE id = $8
      RETURNING *`,
      [normDate, category ?? null, description ?? null, amount ?? null, payment_mode ?? null, account_id ?? null, notes ?? null, id],
    );

    if (rows.length === 0) throw new AppError(404, 'Expense not found');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    if (rowCount === 0) throw new AppError(404, 'Expense not found');

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
