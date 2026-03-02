import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheMiddleware } from '../cache/cacheMiddleware.js';
import { CacheKeys, CacheTTL } from '../cache/cacheKeys.js';
import { invalidateProfiles, invalidateUserRoles } from '../cache/invalidation.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// --------------- Apply Admin Check to all user routes ---------------
router.use(requireAdmin);

// --------------- GET users (profiles + roles) ---------------

router.get(
  '/',
  cacheMiddleware(() => CacheKeys.profiles(), CacheTTL.LONG),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows: profiles } = await pool.query(
        'SELECT * FROM profiles ORDER BY created_at DESC',
      );
      const { rows: roles } = await pool.query('SELECT * FROM user_roles');

      res.json({ profiles, roles });
    } catch (err) {
      next(err);
    }
  },
);

// --------------- POST create user ---------------

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { email, password, full_name, phone, roles } = req.body;

    if (!email?.trim()) throw new AppError(400, 'Email is required');
    if (!full_name?.trim()) throw new AppError(400, 'Full name is required');
    if (!password || password.length < 6) throw new AppError(400, 'Password must be at least 6 characters');

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    const { rows: profileRows } = await client.query(
      `INSERT INTO profiles (email, password_hash, full_name, phone, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, full_name, phone, is_active, created_at, updated_at`,
      [email.trim().toLowerCase(), passwordHash, full_name, phone || null],
    );
    const userId = profileRows[0].id;

    if (roles && Array.isArray(roles) && roles.length > 0) {
      for (const role of roles) {
        await client.query(
          'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
          [userId, role],
        );
      }
    }

    await client.query('COMMIT');

    await invalidateProfiles();
    await invalidateUserRoles();
    res.status(201).json(profileRows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// --------------- PUT update profile ---------------

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, full_name, phone } = req.body;

    if (email !== undefined && !email.trim()) {
      throw new AppError(400, 'Email cannot be empty');
    }

    const { rows } = await pool.query(
      `UPDATE profiles SET
        email     = COALESCE($1, email),
        full_name = COALESCE($2, full_name),
        phone     = COALESCE($3, phone),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *`,
      [email ?? null, full_name ?? null, phone ?? null, id],
    );

    if (rows.length === 0) throw new AppError(404, 'User not found');

    await invalidateProfiles();
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// --------------- POST deactivate ---------------

router.post('/:id/deactivate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `UPDATE profiles SET is_active = false, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );
    if (rows.length === 0) throw new AppError(404, 'User not found');

    await invalidateProfiles();
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// --------------- POST activate ---------------

router.post('/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `UPDATE profiles SET is_active = true, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id],
    );
    if (rows.length === 0) throw new AppError(404, 'User not found');

    await invalidateProfiles();
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// --------------- POST assign role ---------------

router.post('/:id/roles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) throw new AppError(400, 'Role is required');

    const { rows } = await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) RETURNING *',
      [id, role],
    );

    await invalidateUserRoles();
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// --------------- DELETE remove role ---------------

router.delete('/:id/roles/:role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role } = req.params;

    const { rowCount } = await pool.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role = $2',
      [id, role],
    );
    if (rowCount === 0) throw new AppError(404, 'Role assignment not found');

    await invalidateUserRoles();
    res.json({ message: 'Role removed' });
  } catch (err) {
    next(err);
  }
});

export default router;
