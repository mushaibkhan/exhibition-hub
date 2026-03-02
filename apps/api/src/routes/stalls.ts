import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { exhibitionScope } from '../middleware/exhibitionScope.js';
import { cacheMiddleware } from '../cache/cacheMiddleware.js';
import { CacheKeys, CacheTTL } from '../cache/cacheKeys.js';
import { invalidateStalls } from '../cache/invalidation.js';

const router = Router();

router.get(
  '/',
  exhibitionScope,
  cacheMiddleware((req) => CacheKeys.stalls(req.exhibitionId!), CacheTTL.LONG),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await pool.query(
        `SELECT s.*,
                sl.position_x, sl.position_y, sl.width, sl.height
         FROM stalls s
         LEFT JOIN stall_layouts sl ON sl.stall_id = s.id
         WHERE s.exhibition_id = $1
         ORDER BY s.stall_number`,
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
      const { stall_number, zone, base_rent, notes } = req.body;
      const exhibitionId = req.exhibitionId!;

      if (!stall_number || !zone || base_rent === undefined) {
        throw new AppError(400, 'stall_number, zone, and base_rent are required');
      }

      const { rows: existing } = await pool.query(
        `SELECT id FROM stalls WHERE exhibition_id = $1 AND stall_number = $2`,
        [exhibitionId, stall_number],
      );
      if (existing.length > 0) {
        throw new AppError(409, `Stall number '${stall_number}' already exists in this exhibition`);
      }

      const { rows: maxPos } = await pool.query(
        `SELECT COALESCE(MAX(sl.position_y * 12 + sl.position_x), -1) AS max_index
         FROM stall_layouts sl
         JOIN stalls s ON sl.stall_id = s.id
         WHERE s.exhibition_id = $1 AND s.zone = $2`,
        [exhibitionId, zone],
      );
      const nextIndex = (maxPos[0]?.max_index ?? -1) + 1;
      const position_x = nextIndex % 12;
      const position_y = Math.floor(nextIndex / 12);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const { rows: stallRows } = await client.query(
          `INSERT INTO stalls (exhibition_id, stall_number, zone, base_rent, notes)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [exhibitionId, stall_number, zone, Number(base_rent), notes || null],
        );
        const stall = stallRows[0];

        await client.query(
          `INSERT INTO stall_layouts (stall_id, position_x, position_y, width, height)
           VALUES ($1, $2, $3, 1, 1)`,
          [stall.id, position_x, position_y],
        );

        await client.query('COMMIT');

        await invalidateStalls(exhibitionId);
        res.status(201).json({ ...stall, position_x, position_y, width: 1, height: 1 });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rows: stallRows } = await pool.query(`SELECT * FROM stalls WHERE id = $1`, [id]);
    if (stallRows.length === 0) throw new AppError(404, 'Stall not found');
    const stall = stallRows[0];

    const { rows: txnItems } = await pool.query(
      `SELECT ti.id FROM transaction_items ti
       JOIN transactions t ON ti.transaction_id = t.id
       WHERE ti.stall_id = $1 AND ti.item_type = 'stall' AND t.cancelled = false`,
      [id],
    );
    if (txnItems.length > 0) {
      throw new AppError(400, 'Cannot delete stall with active transactions');
    }

    await pool.query(`DELETE FROM stall_layouts WHERE stall_id = $1`, [id]);
    await pool.query(`DELETE FROM stalls WHERE id = $1`, [id]);

    await invalidateStalls(stall.exhibition_id);
    res.json({ message: 'Stall deleted' });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stall_number, zone, base_rent, is_blocked, notes } = req.body;

    const { rows } = await pool.query(
      `UPDATE stalls
       SET stall_number = COALESCE($1, stall_number),
           zone         = COALESCE($2, zone),
           base_rent    = COALESCE($3, base_rent),
           is_blocked   = COALESCE($4, is_blocked),
           notes        = COALESCE($5, notes),
           updated_at   = NOW()
       WHERE id = $6
       RETURNING *`,
      [stall_number ?? null, zone ?? null, base_rent ?? null, is_blocked ?? null, notes ?? null, id],
    );

    if (rows.length === 0) throw new AppError(404, 'Stall not found');

    const exhibitionId = rows[0].exhibition_id;
    await invalidateStalls(exhibitionId);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
