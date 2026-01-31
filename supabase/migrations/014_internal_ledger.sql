-- Create internal_ledger table for tracking team cash movements
create table if not exists public.internal_ledger (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid not null references public.exhibitions(id) on delete cascade,
  from_name text not null,
  to_name text not null,
  amount numeric not null check (amount > 0),
  description text,
  status text not null default 'pending' check (status in ('pending', 'settled')),
  settled_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index if not exists idx_internal_ledger_exhibition on public.internal_ledger(exhibition_id);
create index if not exists idx_internal_ledger_status on public.internal_ledger(status);

-- Enable RLS
alter table public.internal_ledger enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Allow all operations for authenticated users" on public.internal_ledger;
drop policy if exists "Allow all operations for anon users" on public.internal_ledger;
drop policy if exists "Allow read for anon" on public.internal_ledger;

-- RLS policies - allow all operations for both authenticated and anon users
create policy "Allow all operations for authenticated users"
  on public.internal_ledger
  for all
  to authenticated
  using (true)
  with check (true);

create policy "Allow all operations for anon users"
  on public.internal_ledger
  for all
  to anon
  using (true)
  with check (true);

-- Grant permissions
grant all on public.internal_ledger to authenticated;
grant all on public.internal_ledger to anon;
