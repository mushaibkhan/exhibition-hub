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
        'SELECT * FROM leads WHERE exhibition_id = $1 ORDER BY created_at DESC',
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
      exhibition_id, name, phone, email, company, status,
      interested_stalls, target_stall_count, interested_zone,
      quoted_amount, quoted_gst, quoted_cgst, quoted_sgst, quoted_total,
      notes, created_by,
    } = req.body;

    if (!exhibition_id) throw new AppError(400, 'exhibition_id is required');
    if (!name?.trim()) throw new AppError(400, 'Lead name is required');
    if (!phone?.trim()) throw new AppError(400, 'Phone number is required');

    const { rows } = await pool.query(
      `INSERT INTO leads (
        exhibition_id, name, phone, email, company, status,
        interested_stalls, target_stall_count, interested_zone,
        quoted_amount, quoted_gst, quoted_cgst, quoted_sgst, quoted_total,
        notes, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        exhibition_id, name, phone, email || null, company || null, status || 'new',
        interested_stalls || '{}', target_stall_count ?? null, interested_zone || null,
        quoted_amount ?? 0, quoted_gst ?? false, quoted_cgst ?? 0, quoted_sgst ?? 0, quoted_total ?? 0,
        notes || null, created_by || null,
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
    const {
      name, phone, email, company, status,
      interested_stalls, target_stall_count, interested_zone,
      quoted_amount, quoted_gst, quoted_cgst, quoted_sgst, quoted_total,
      notes, created_by,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE leads SET
        name              = COALESCE($1, name),
        phone             = COALESCE($2, phone),
        email             = COALESCE($3, email),
        company           = COALESCE($4, company),
        status            = COALESCE($5, status),
        interested_stalls = COALESCE($6, interested_stalls),
        target_stall_count= COALESCE($7, target_stall_count),
        interested_zone   = COALESCE($8, interested_zone),
        quoted_amount     = COALESCE($9, quoted_amount),
        quoted_gst        = COALESCE($10, quoted_gst),
        quoted_cgst       = COALESCE($11, quoted_cgst),
        quoted_sgst       = COALESCE($12, quoted_sgst),
        quoted_total      = COALESCE($13, quoted_total),
        notes             = COALESCE($14, notes),
        created_by        = COALESCE($15, created_by),
        updated_at        = NOW()
      WHERE id = $16
      RETURNING *`,
      [
        name ?? null, phone ?? null, email ?? null, company ?? null, status ?? null,
        interested_stalls ?? null, target_stall_count ?? null, interested_zone ?? null,
        quoted_amount ?? null, quoted_gst ?? null, quoted_cgst ?? null, quoted_sgst ?? null, quoted_total ?? null,
        notes ?? null, created_by ?? null, id,
      ],
    );

    if (rows.length === 0) throw new AppError(404, 'Lead not found');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rows: txns } = await pool.query(
      'SELECT id FROM transactions WHERE lead_id = $1 LIMIT 1',
      [id],
    );
    if (txns.length > 0) {
      throw new AppError(409, 'Cannot delete lead with existing transactions. Cancel transactions first.');
    }

    const { rowCount } = await pool.query('DELETE FROM leads WHERE id = $1', [id]);
    if (rowCount === 0) throw new AppError(404, 'Lead not found');

    res.json({ message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
