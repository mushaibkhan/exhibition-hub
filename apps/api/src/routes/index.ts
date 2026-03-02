import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/db.js';
import { exhibitionScope } from '../middleware/exhibitionScope.js';
import { requireAuth } from '../middleware/auth.js';
import auth from './auth.js';
import exhibitions from './exhibitions.js';
import stalls from './stalls.js';
import leads from './leads.js';
import services from './services.js';
import transactions from './transactions.js';
import payments from './payments.js';
import expenses from './expenses.js';
import expenseCategories from './expenseCategories.js';
import accounts from './accounts.js';
import internalLedger from './internalLedger.js';
import users from './users.js';
import serviceAllocations from './serviceAllocations.js';

const router = Router();

// Public auth routes (no token required)
router.use('/auth', auth);

// All routes below require authentication
router.use(requireAuth);

router.use('/exhibitions', exhibitions);
router.use('/stalls', stalls);
router.use('/leads', leads);
router.use('/services', services);
router.use('/transactions', transactions);
router.use('/payments', payments);
router.use('/expenses', expenses);
router.use('/expense-categories', expenseCategories);
router.use('/accounts', accounts);
router.use('/internal-ledger', internalLedger);
router.use('/users', users);
router.use('/service-allocations', serviceAllocations);

router.get(
  '/transaction-items',
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

export default router;
