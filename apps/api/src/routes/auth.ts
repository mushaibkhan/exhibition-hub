import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateToken, requireAuth, JwtPayload } from '../middleware/auth.js';
import { invalidateProfiles, invalidateUserRoles } from '../cache/invalidation.js';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().min(1),
    phone: z.string().optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string(),
    new_password: z.string().min(6),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post('/login', loginLimiter, validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

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
      token, // Also serve as refresh token for now since expiry is long, or clients will use token to call /refresh
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

router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { email, password, full_name, phone } = req.body;

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

    const roles = roleRows.map((r: any) => r.role);

    // Refresh token silently on each /me fetch
    const refreshedToken = generateToken({
      userId: req.user!.userId,
      email: rows[0].email,
      roles,
    });

    res.json({
      ...rows[0],
      roles,
      token: refreshedToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/change-password', requireAuth, validate(changePasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { current_password, new_password } = req.body;

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

router.post('/forgot-password', validate(resetPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    // Simulating sending email with token.
    const { rows } = await pool.query(
      'SELECT id FROM profiles WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (rows.length > 0) {
      // Typically generate a short-lived random token and store it.
      // E.g., const resetToken = crypto.randomBytes(32).toString('hex');
      // await pool.query('UPDATE profiles SET reset_token = $1 ...');
      // sendEmail(email, resetUrl);
      console.log(`MOCK: Sent password reset link to ${email}`);
    }

    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});

export default router;
