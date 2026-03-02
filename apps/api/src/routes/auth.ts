import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateToken, requireAuth, JwtPayload } from '../middleware/auth.js';
import { invalidateProfiles, invalidateUserRoles } from '../cache/invalidation.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    const { rows: users } = await pool.query(
      'SELECT * FROM profiles WHERE email = $1',
      [email.trim().toLowerCase()],
    );

    if (users.length === 0) {
      throw new AppError(401, 'Invalid email or password');
    }

    const user = users[0];

    if (!user.is_active) {
      throw new AppError(403, 'Your account has been deactivated. Contact an administrator.');
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new AppError(401, 'Invalid email or password');
    }

    const { rows: roleRows } = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [user.id],
    );
    const roles = roleRows.map((r: any) => r.role);

    if (roles.length === 0) {
      throw new AppError(403, 'Your account has no assigned role. Contact an administrator.');
    }

    await pool.query(
      'UPDATE profiles SET last_login_at = NOW() WHERE id = $1',
      [user.id],
    );

    const token = generateToken({
      userId: user.id,
      email: user.email,
      roles,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        is_active: user.is_active,
        roles,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email?.trim()) throw new AppError(400, 'Email is required');
    if (!password || password.length < 6) throw new AppError(400, 'Password must be at least 6 characters');
    if (!full_name?.trim()) throw new AppError(400, 'Full name is required');

    const normalizedEmail = email.trim().toLowerCase();

    const { rows: existing } = await pool.query(
      'SELECT id FROM profiles WHERE email = $1',
      [normalizedEmail],
    );
    if (existing.length > 0) {
      throw new AppError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO profiles (email, password_hash, full_name, phone, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, full_name, phone, is_active, created_at`,
      [normalizedEmail, passwordHash, full_name.trim(), phone || null],
    );

    await client.query('COMMIT');

    await invalidateProfiles();

    res.status(201).json({
      message: 'Account created. An administrator must assign you a role before you can log in.',
      user: rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, phone, is_active, last_login_at, created_at FROM profiles WHERE id = $1',
      [req.user!.userId],
    );

    if (rows.length === 0) {
      throw new AppError(404, 'User not found');
    }

    const { rows: roleRows } = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [req.user!.userId],
    );

    res.json({
      ...rows[0],
      roles: roleRows.map((r: any) => r.role),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      throw new AppError(400, 'Current password and new password are required');
    }
    if (new_password.length < 6) {
      throw new AppError(400, 'New password must be at least 6 characters');
    }

    const { rows } = await pool.query(
      'SELECT password_hash FROM profiles WHERE id = $1',
      [req.user!.userId],
    );
    if (rows.length === 0) throw new AppError(404, 'User not found');

    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) throw new AppError(401, 'Current password is incorrect');

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, req.user!.userId],
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
