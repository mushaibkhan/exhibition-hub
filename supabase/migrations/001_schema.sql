-- ============================================
-- Exhibition Hub: Consolidated Schema
-- For PostgreSQL 16 (standalone, no Supabase)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM Types
-- ============================================

CREATE TYPE lead_status AS ENUM ('new', 'follow_up', 'interested', 'not_interested', 'converted');
CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');
CREATE TYPE payment_mode AS ENUM ('cash', 'upi', 'bank');
CREATE TYPE service_category AS ENUM ('sponsor', 'signboard', 'food_court', 'add_on');
CREATE TYPE item_type AS ENUM ('stall', 'service');
CREATE TYPE app_role AS ENUM ('admin', 'maintainer');
CREATE TYPE expense_category AS ENUM ('venue', 'furniture', 'marketing', 'utilities', 'staff', 'misc');

-- ============================================
-- Tables
-- ============================================

CREATE TABLE exhibitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stalls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  stall_number TEXT NOT NULL,
  zone TEXT,
  base_rent NUMERIC(12, 2) NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exhibition_id, stall_number)
);

CREATE TABLE stall_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE CASCADE UNIQUE,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  status lead_status DEFAULT 'new',
  interested_zone TEXT,
  interested_stalls TEXT[] DEFAULT '{}',
  target_stall_count INTEGER DEFAULT NULL,
  quoted_amount NUMERIC(12, 2) DEFAULT 0,
  quoted_gst BOOLEAN DEFAULT FALSE,
  quoted_cgst NUMERIC(12, 2) DEFAULT 0,
  quoted_sgst NUMERIC(12, 2) DEFAULT 0,
  quoted_total NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  transaction_number TEXT NOT NULL,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  total_amount NUMERIC(12, 2) NOT NULL,
  is_gst BOOLEAN DEFAULT FALSE,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  cgst_amount NUMERIC(12, 2) DEFAULT 0,
  sgst_amount NUMERIC(12, 2) DEFAULT 0,
  gst_amount NUMERIC(12, 2) DEFAULT 0,
  discount_type VARCHAR(20) DEFAULT NULL,
  discount_value NUMERIC(12, 2) DEFAULT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  created_by UUID,
  cancelled BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exhibition_id, transaction_number),
  CONSTRAINT check_discount_type CHECK (discount_type IS NULL OR discount_type IN ('fixed', 'percentage'))
);

CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  stall_id UUID REFERENCES stalls(id) ON DELETE RESTRICT,
  service_id UUID,
  item_name TEXT NOT NULL,
  size TEXT,
  base_price NUMERIC(12, 2) NOT NULL,
  addon_price NUMERIC(12, 2) DEFAULT 0,
  final_price NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category service_category NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  sold_quantity INTEGER DEFAULT 0,
  is_unlimited BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transaction_items
  ADD CONSTRAINT transaction_items_service_id_fkey
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT;

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_mode payment_mode NOT NULL,
  account_id UUID,
  reference_id TEXT,
  payment_date DATE NOT NULL,
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  upi_details TEXT,
  bank_details TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments
  ADD CONSTRAINT payments_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;

CREATE TABLE service_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_mode payment_mode NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE internal_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  to_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Foreign Key Constraints (user references)
-- ============================================

ALTER TABLE leads
  ADD CONSTRAINT leads_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE payments
  ADD CONSTRAINT payments_recorded_by_fkey
  FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_stalls_exhibition_id ON stalls(exhibition_id);
CREATE INDEX idx_stalls_stall_number ON stalls(stall_number);
CREATE INDEX idx_stall_layouts_stall_id ON stall_layouts(stall_id);
CREATE INDEX idx_leads_exhibition_id ON leads(exhibition_id);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_leads_interested_stalls ON leads USING GIN (interested_stalls);
CREATE INDEX idx_transactions_exhibition_id ON transactions(exhibition_id);
CREATE INDEX idx_transactions_lead_id ON transactions(lead_id);
CREATE INDEX idx_transactions_transaction_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transaction_items_exhibition_id ON transaction_items(exhibition_id);
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_stall_id ON transaction_items(stall_id);
CREATE INDEX idx_transaction_items_service_id ON transaction_items(service_id);
CREATE INDEX idx_payments_exhibition_id ON payments(exhibition_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_recorded_by ON payments(recorded_by);
CREATE INDEX idx_services_exhibition_id ON services(exhibition_id);
CREATE INDEX idx_service_allocations_exhibition_id ON service_allocations(exhibition_id);
CREATE INDEX idx_service_allocations_stall_id ON service_allocations(stall_id);
CREATE INDEX idx_service_allocations_service_id ON service_allocations(service_id);
CREATE INDEX idx_service_allocations_transaction_id ON service_allocations(transaction_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_internal_ledger_exhibition ON internal_ledger(exhibition_id);
CREATE INDEX idx_internal_ledger_status ON internal_ledger(status);

-- ============================================
-- Trigger Function: auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers
-- ============================================

CREATE TRIGGER update_exhibitions_updated_at BEFORE UPDATE ON exhibitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stalls_updated_at BEFORE UPDATE ON stalls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stall_layouts_updated_at BEFORE UPDATE ON stall_layouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views
-- ============================================

CREATE OR REPLACE VIEW stall_status_view AS
SELECT
  s.id,
  s.exhibition_id,
  s.stall_number,
  s.zone,
  s.base_rent,
  s.is_blocked,
  s.notes,
  s.created_at,
  s.updated_at,
  CASE
    WHEN s.is_blocked THEN 'blocked'::text
    WHEN ti.id IS NULL THEN 'available'::text
    WHEN t.cancelled THEN 'available'::text
    WHEN COALESCE(payment_sum.total_paid, 0) >= t.total_amount THEN 'sold'::text
    WHEN COALESCE(payment_sum.total_paid, 0) > 0 THEN 'pending'::text
    ELSE 'reserved'::text
  END AS status
FROM stalls s
LEFT JOIN transaction_items ti ON ti.stall_id = s.id AND ti.item_type = 'stall'::item_type
LEFT JOIN transactions t ON t.id = ti.transaction_id AND NOT t.cancelled
LEFT JOIN (
  SELECT transaction_id, SUM(amount) AS total_paid
  FROM payments
  GROUP BY transaction_id
) payment_sum ON payment_sum.transaction_id = t.id;

CREATE OR REPLACE VIEW transaction_summary_view AS
SELECT
  t.id,
  t.exhibition_id,
  t.transaction_number,
  t.lead_id,
  t.total_amount,
  t.notes,
  t.created_by,
  t.cancelled,
  t.cancelled_at,
  t.created_at,
  t.updated_at,
  COALESCE(payment_sum.total_paid, 0) AS amount_paid,
  CASE
    WHEN t.cancelled THEN 'unpaid'::payment_status
    WHEN COALESCE(payment_sum.total_paid, 0) >= t.total_amount THEN 'paid'::payment_status
    WHEN COALESCE(payment_sum.total_paid, 0) > 0 THEN 'partial'::payment_status
    ELSE 'unpaid'::payment_status
  END AS payment_status
FROM transactions t
LEFT JOIN (
  SELECT transaction_id, SUM(amount) AS total_paid
  FROM payments
  GROUP BY transaction_id
) payment_sum ON payment_sum.transaction_id = t.id;

-- ============================================
-- Functions
-- ============================================

CREATE OR REPLACE FUNCTION get_stall_status(stall_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  result_status TEXT;
BEGIN
  SELECT status INTO result_status
  FROM stall_status_view
  WHERE id = stall_uuid;

  RETURN COALESCE(result_status, 'available');
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_transaction_payment_summary(txn_uuid UUID)
RETURNS TABLE(
  amount_paid NUMERIC,
  payment_status payment_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.amount_paid,
    ts.payment_status
  FROM transaction_summary_view ts
  WHERE ts.id = txn_uuid;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION increment_service_sold_quantity(p_service_id UUID, increment_by INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE services
  SET sold_quantity = COALESCE(sold_quantity, 0) + increment_by
  WHERE id = p_service_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_service_sold_quantity(p_service_id UUID, decrement_by INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE services
  SET sold_quantity = GREATEST(0, COALESCE(sold_quantity, 0) - decrement_by)
  WHERE id = p_service_id;
END;
$$ LANGUAGE plpgsql;
