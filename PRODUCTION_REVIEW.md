# HydExpo / Exhibition Hub - Production Readiness Review

## 1. Flow Traces & End-to-End Walkthrough

### 1.1 Auth Flow
- **Frontend**: `apps/frontend/src/pages/Auth.tsx` manages login, registration, and password change via TanStack Query. Uses `api.ts` (Bearer token from `localStorage`). Redirects to `/auth` gracefully on 401 via `api.ts` intercepter. Session expiry handled globally.
- **API**: `apps/api/src/routes/auth.ts`. Issues JWT tokens with `bcrypt` password validation. Requires active profiles and roles (`user_roles`).
- **DB/Cache**: Validates credentials against `profiles` table. Rate limited via IP `loginLimiter` using Redis. Cache invalidation mechanism (`invalidateProfiles`) manages state syncing. Token expiry enforced correctly.

### 1.2 Dashboard & Exhibitions
- **Frontend**: Scoped explicitly by `exhibition_id`. Context providers `DataContext.tsx` filter all data fetches by the active exhibition ID. Loading skeletons and toast messages provided for errors.
- **API**: `apps/api/src/middleware/exhibitionScope.ts` strictly checks headers/queries for UUID validation. Rejects missing IDs natively.
- **DB/Cache**: Dashboards heavily query lists. `stalls`, `services`, `leads` natively utilize `cacheMiddleware` which reads from Redis successfully preventing DB thrashing.

### 1.3 Leads (CRUD, Status)
- **Frontend**: `apps/frontend/src/pages/Leads.tsx` populates datatables properly with mobile responsive cards.
- **API**: `apps/api/src/routes/leads.ts`. Maps POST, PUT, DELETE operations strictly isolating `exhibition_id`.
- **DB/Cache**: Inserts into `leads` table. Prevents leads deletion if they possess active transactions (`apps/api/src/routes/leads.ts:121`).

### 1.4 Transactions, Payments & Services (Allocations)
- **Frontend**: Multi-step flow in `Transactions.tsx`. Validates amounts and item allocations. Blocks payments if the amount exceeds the remaining pending balance.
- **API**: `apps/api/src/routes/transactions.ts` and `payments.ts`. Handles total recalculations natively during mutations. Item prices and negative numbers are blocked natively by manual logic (`if (transaction.total_amount < 0)`).
- **DB/Cache**: Multi-step transaction wrapped within `BEGIN`/`COMMIT` SQL logic (`apps/api/src/routes/transactions.ts:107`). `sold_quantity` dynamically increments/decrements natively inside SQL statements ensuring sync.

## 2. Working (Feature & Flow)
- **Data Export & Invoices**: Quotations & Invoice generations use valid HTML->PDF/Image and XLS data mappers (`lib/generateInvoicePDF.ts`, `lib/exportUtils.ts`, `lib/invoiceUtils.ts`). Calculations map GST accurately.
- **Scoping & Layout Maps**: Grid setup accurately bounds stall positioning without collisions using indexing logic (`apps/api/src/routes/stalls.ts:60`). Layout maps sync with base entities smoothly.
- **Database Graceful Operations**: Connection starts synchronously, `redis` failover continues operations even if the cache crashes (`apps/api/src/index.ts:40`). Shutting down processes (`pool.end()`, `redis.quit()`) successfully closes connections cleanly via SIGTERM/SIGINT.

## 3. Issues (Bugs, Security, or Production Risks)

### Critical / High Severity
1. **Unsafe JWT & Passwords Defaults**
   - *What*: `docker-compose.yml` defaults to weak passwords natively (`POSTGRES_PASSWORD: ${DB_PASSWORD:-devpassword123}`).
   - *Fix*: Remove default value interpolations inside `docker-compose.yml`. Force ops scripts or `.env` files to provide `DB_PASSWORD`.
2. **Missing Input Validation (Zod)**
   - *What*: Throughout `apps/api/src/routes/`, request payloads are manually checked (e.g., `transactions.ts:98` `if (!transaction)`). Deeply nested JSON payloads (like `items` array) lack robust validation, allowing type mismatches (strings instead of numbers) potentially leading to SQL errors or faulty data integrity.
   - *Fix*: Implement `Zod` validation middleware globally. Define strict schemas for all POST/PUT routes.
3. **Frontend Dependency Vulnerabilities**
   - *What*: Running `npm audit` inside `apps/frontend` returned 7 High vulnerabilities (`xlsx`, `rollup`, `react-router`, `glob`). Prototype Pollution in `xlsx` poses a risk if processing external excel files is implemented later.
   - *Fix*: Run `npm audit fix` in `apps/frontend`.

### Medium Severity
1. **Raw Errors Leaked to Container Logs**
   - *What*: `apps/api/src/middleware/errorHandler.ts:16` logs `console.error('Unhandled error:', err)`. Production environments shouldn't dump untyped error objects into log streams, potentially leaking secrets if a request payload contained them.
   - *Fix*: Stringify strictly the `err.message` and `err.stack` alongside a sanitised payload if needed.
2. **Missing Production CORS Origin Lock**
   - *What*: `apps/api/src/config/env.ts:9` defaults `corsOrigin: process.env.CORS_ORIGIN || '*'`. In a production setting, preflight requests will be allowed arbitrarily.
   - *Fix*: Use `false` or a static, predefined strict URL when `isProduction` is true.

### Low Severity
1. **Leftover Debugging Statements in Frontend**
   - *What*: `apps/frontend/src/pages/Transactions.tsx` contains unguarded `console.error('Failed to generate invoice:', invoiceError)` (lines 152, 190).
   - *Fix*: Wrap logs in `if (import.meta.env.DEV)` conditionals or remove them for cleaner production logs.

## 4. Suggestions (Improvements for Production Quality)
1. **Concurrency Risk on Services**:
   - *What*: While transactions utilize `BEGIN`/`COMMIT` accurately (`transactions.ts:153`), the `sold_quantity` increment queries (`UPDATE services SET sold_quantity = sold_quantity + 1 WHERE id = $1`) do not verify if `sold_quantity < quantity`.
   - *Suggestion*: Add a `CHECK (sold_quantity <= quantity)` constraint in the PostgreSQL schema natively or add an `IF` condition inside the query returning an error if capacity is exceeded.
2. **Docker Production Volumes/Migrations**:
   - *What*: The `deploy/docker-compose.production.yml` relies on mounting `../supabase/migrations:/docker-entrypoint-initdb.d`. The directory is structured properly (`001_schema.sql`, `002_seed.sql`, `003_expense_categories.sql` alongside `archive/`). PostgreSQL iterates these alphabetically, which works, but can fail if future files misalign.
   - *Suggestion*: Create a singular orchestrated script (`init.sh`) mapped inside `docker-entrypoint-initdb.d` explicitly controlling the order instead.
3. **Build Artifacts Validation**:
   - *What*: The `Dockerfile.production` safely changes ownership to a non-root user `nodejs:1001`. Ensure the underlying mapped volumes (`pgdata`, `redisdata`) do not face ownership/permission clashes if the node user needs to interact locally.
