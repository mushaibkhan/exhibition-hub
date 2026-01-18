# Supabase Backend Setup

This directory contains SQL migrations for setting up the Supabase PostgreSQL database for the Exhibition Hub application.

## Prerequisites

1. A Supabase project (create one at https://supabase.com)
2. Your Supabase project URL and anon/public key

## Setup Steps

### 1. Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Note your project URL and anon key from Settings > API

### 2. Run Migrations

Run the migrations in order:

```bash
# Connect to your Supabase database via SQL Editor or CLI
# Run each migration file in order:

1. 001_initial_schema.sql - Creates all tables, indexes, and triggers
2. 002_create_views.sql - Creates database views for derived data
3. 003_rls_policies.sql - Sets up Row Level Security policies
4. 004_seed_data.sql - Seeds initial exhibitions and accounts
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 4. Generate TypeScript Types (Optional)

After running migrations, generate TypeScript types:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/integrations/supabase/types.ts
```

Or use the Supabase CLI:

```bash
supabase gen types typescript --project-id <your-project-id> > src/integrations/supabase/types.ts
```

### 5. Seed Stalls and Layouts

The migrations create exhibitions, but stalls and layouts need to be seeded. You can:

1. Use the application's data generation (currently uses mock data)
2. Create a seed script to insert stalls and layouts from `src/lib/multiExhibitionData.ts`
3. Use the Supabase dashboard to manually insert data

## Database Schema Overview

### Core Tables

- **exhibitions** - Exhibition metadata
- **stalls** - Stall information (no status, size, or position - these are derived)
- **stall_layouts** - Floor positioning for stalls (one row per stall)
- **leads** - Lead/customer information
- **transactions** - Transaction records (no amount_paid or payment_status - derived)
- **transaction_items** - Items in transactions (stalls or services)
- **payments** - Payment records
- **services** - Service catalog
- **service_allocations** - Service-to-stall allocations
- **accounts** - Payment accounts (shared across exhibitions)

### Derived Data (Views)

- **stall_status_view** - Computes stall status from transactions and payments
- **transaction_summary_view** - Computes payment totals and status

### Key Design Decisions

1. **No Stored Status**: Stall status and transaction payment status are derived, not stored
2. **Exhibition Isolation**: All core tables have `exhibition_id` for strict data isolation
3. **Layout Separation**: Stall positioning is in a separate `stall_layouts` table
4. **Audit Trail**: Cancelled transactions are marked, not deleted

## Row Level Security (RLS)

RLS is enabled on all tables. Currently, policies allow all operations for simplicity. In production, you should:

1. Implement proper authentication
2. Use session variables for exhibition context
3. Restrict access based on user roles

## Migration Order

Always run migrations in this order:

1. `001_initial_schema.sql` - Base schema
2. `002_create_views.sql` - Views depend on tables
3. `003_rls_policies.sql` - Policies depend on tables
4. `004_seed_data.sql` - Seed data depends on tables

## Troubleshooting

### "relation does not exist" errors

- Ensure migrations ran in order
- Check that all tables were created in the `public` schema

### Type generation errors

- Verify your Supabase project ID is correct
- Ensure you have the latest `@supabase/supabase-js` package

### RLS blocking queries

- Check that RLS policies are correctly set up
- Verify exhibition_id is being passed correctly in queries

## Next Steps

1. Run migrations in your Supabase project
2. Update environment variables
3. Test the application with real database connections
4. Implement proper authentication and RLS policies for production
