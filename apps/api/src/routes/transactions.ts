import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { exhibitionScope } from '../middleware/exhibitionScope.js';

const router = Router();

// --------------- GET transactions ---------------

router.get(
  '/',
  exhibitionScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM transactions WHERE exhibition_id = $1 ORDER BY created_at DESC',
        [req.exhibitionId],
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
);

// --------------- GET transaction items ---------------

router.get(
  '/items',
  exhibitionScope,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM transaction_items WHERE exhibition_id = $1',
        [req.exhibitionId],
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
);

// --------------- POST create transaction (multi-step) ---------------

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { transaction, items, selectedStallId } = req.body;

    if (!transaction) throw new AppError(400, 'Transaction data is required');
    if (!transaction.exhibition_id) throw new AppError(400, 'exhibition_id is required');
    if (!transaction.lead_id) throw new AppError(400, 'lead_id is required');
    if (!items || items.length === 0) throw new AppError(400, 'At least one item is required');
    if (transaction.total_amount < 0) throw new AppError(400, 'Transaction total cannot be negative');

    for (const item of items) {
      if (item.item_type === 'stall' && !item.stall_id) throw new AppError(400, 'stall_id required for stall items');
      if (item.item_type === 'service' && !item.service_id) throw new AppError(400, 'service_id required for service items');
      if (item.final_price < 0) throw new AppError(400, 'Item price cannot be negative');
    }

    // Step 1: Generate transaction number
    const now = Date.now();
    const random = String(crypto.randomInt(1000)).padStart(3, '0');
    const year = new Date().getFullYear();
    const txnNumber = `TXN-${year}-${now}-${random}`;

    await client.query('BEGIN');

    // Step 2: Insert transaction
    const { amount_paid, payment_status, lead, ...txnData } = transaction;
    const { rows: txnRows } = await client.query(
      `INSERT INTO transactions (
        exhibition_id, transaction_number, lead_id,
        is_gst, subtotal, cgst_amount, sgst_amount, gst_amount, total_amount,
        discount_type, discount_value, discount_amount,
        notes, created_by, cancelled, cancelled_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,false,NULL)
      RETURNING *`,
      [
        txnData.exhibition_id, txnNumber, txnData.lead_id,
        txnData.is_gst ?? false, txnData.subtotal ?? 0,
        txnData.cgst_amount ?? 0, txnData.sgst_amount ?? 0, txnData.gst_amount ?? 0,
        txnData.total_amount ?? 0,
        txnData.discount_type ?? null, txnData.discount_value ?? null, txnData.discount_amount ?? 0,
        txnData.notes ?? null, txnData.created_by ?? null,
      ],
    );
    const createdTxn = txnRows[0];

    // Step 3: Insert transaction items
    const insertedItems = [];
    for (const item of items) {
      const { rows: itemRows } = await client.query(
        `INSERT INTO transaction_items (
          exhibition_id, transaction_id, item_type,
          stall_id, service_id, item_name, size,
          base_price, addon_price, final_price
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *`,
        [
          txnData.exhibition_id, createdTxn.id, item.item_type,
          item.stall_id ?? null, item.service_id ?? null,
          item.item_name, item.size ?? null,
          item.base_price ?? 0, item.addon_price ?? 0, item.final_price ?? 0,
        ],
      );
      insertedItems.push(itemRows[0]);
    }

    // Step 4: Service allocations + increment sold_quantity
    const serviceItems = items.filter((i: any) => i.item_type === 'service');
    if (serviceItems.length > 0 && selectedStallId) {
      for (const item of serviceItems) {
        if (!item.service_id) continue;

        await client.query(
          `INSERT INTO service_allocations (
            exhibition_id, service_id, stall_id, transaction_id, quantity
          ) VALUES ($1,$2,$3,$4,$5)`,
          [txnData.exhibition_id, item.service_id, selectedStallId, createdTxn.id, 1],
        );

        await client.query(
          `UPDATE services SET sold_quantity = sold_quantity + 1 WHERE id = $1`,
          [item.service_id],
        );
      }
    }

    // Step 5: Mark lead as converted
    await client.query(
      `UPDATE leads SET status = 'converted', updated_at = NOW()
       WHERE id = $1 AND status != 'converted'`,
      [txnData.lead_id],
    );

    await client.query('COMMIT');

    res.status(201).json({
      transaction: createdTxn,
      items: insertedItems,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// --------------- PUT update transaction ---------------

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      is_gst, subtotal, cgst_amount, sgst_amount, gst_amount, total_amount,
      discount_type, discount_value, discount_amount, notes, created_by,
    } = req.body;

    if (total_amount !== undefined && total_amount <= 0) {
      throw new AppError(400, 'Transaction total must be greater than zero');
    }

    const { rows } = await pool.query(
      `UPDATE transactions SET
        is_gst          = COALESCE($1, is_gst),
        subtotal        = COALESCE($2, subtotal),
        cgst_amount     = COALESCE($3, cgst_amount),
        sgst_amount     = COALESCE($4, sgst_amount),
        gst_amount      = COALESCE($5, gst_amount),
        total_amount    = COALESCE($6, total_amount),
        discount_type   = COALESCE($7, discount_type),
        discount_value  = COALESCE($8, discount_value),
        discount_amount = COALESCE($9, discount_amount),
        notes           = COALESCE($10, notes),
        created_by      = COALESCE($11, created_by),
        updated_at      = NOW()
      WHERE id = $12
      RETURNING *`,
      [
        is_gst ?? null, subtotal ?? null, cgst_amount ?? null,
        sgst_amount ?? null, gst_amount ?? null, total_amount ?? null,
        discount_type ?? null, discount_value ?? null, discount_amount ?? null,
        notes ?? null, created_by ?? null, id,
      ],
    );

    if (rows.length === 0) throw new AppError(404, 'Transaction not found');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// --------------- POST cancel transaction ---------------

router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Mark cancelled
    const { rows } = await client.query(
      `UPDATE transactions SET cancelled = true, cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );
    if (rows.length === 0) throw new AppError(404, 'Transaction not found');

    // Fetch linked service allocations
    const { rows: allocations } = await client.query(
      'SELECT * FROM service_allocations WHERE transaction_id = $1',
      [id],
    );

    // Decrement sold_quantity for each allocation and remove
    for (const alloc of allocations) {
      await client.query(
        `UPDATE services SET sold_quantity = GREATEST(0, sold_quantity - $1) WHERE id = $2`,
        [alloc.quantity || 1, alloc.service_id],
      );
    }

    if (allocations.length > 0) {
      await client.query(
        'DELETE FROM service_allocations WHERE transaction_id = $1',
        [id],
      );
    }

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// --------------- DELETE remove service item from transaction ---------------

router.delete('/:txnId/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { txnId, itemId } = req.params;

    await client.query('BEGIN');

    // Get the item (must be a service)
    const { rows: itemRows } = await client.query(
      'SELECT * FROM transaction_items WHERE id = $1 AND transaction_id = $2',
      [itemId, txnId],
    );
    if (itemRows.length === 0) throw new AppError(404, 'Transaction item not found');

    const item = itemRows[0];
    if (item.item_type !== 'service') {
      throw new AppError(400, 'Only service items can be removed this way');
    }

    // Delete the item
    await client.query('DELETE FROM transaction_items WHERE id = $1', [itemId]);

    // Recalculate total from remaining items
    const { rows: remaining } = await client.query(
      'SELECT COALESCE(SUM(final_price), 0) AS new_total FROM transaction_items WHERE transaction_id = $1',
      [txnId],
    );
    const newTotal = Number(remaining[0].new_total);

    await client.query(
      'UPDATE transactions SET total_amount = $1, updated_at = NOW() WHERE id = $2',
      [newTotal, txnId],
    );

    // Remove linked service allocation and decrement sold_quantity
    if (item.service_id) {
      const { rows: allocs } = await client.query(
        `SELECT * FROM service_allocations
         WHERE service_id = $1 AND transaction_id = $2
         LIMIT 1`,
        [item.service_id, txnId],
      );

      if (allocs.length > 0) {
        const alloc = allocs[0];
        await client.query('DELETE FROM service_allocations WHERE id = $1', [alloc.id]);

        await client.query(
          `UPDATE services SET sold_quantity = GREATEST(0, sold_quantity - $1) WHERE id = $2`,
          [alloc.quantity || 1, item.service_id],
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Service item removed', new_total: newTotal });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

export default router;
