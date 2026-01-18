-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE lead_status AS ENUM ('new', 'follow_up', 'interested', 'not_interested', 'converted');
CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');
CREATE TYPE payment_mode AS ENUM ('cash', 'upi', 'bank');
CREATE TYPE service_category AS ENUM ('sponsor', 'signboard', 'food_court', 'add_on');
CREATE TYPE item_type AS ENUM ('stall', 'service');
CREATE TYPE app_role AS ENUM ('admin', 'maintainer');

-- Exhibitions table
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

-- Stalls table (simplified - no status, size, lead_id, position fields)
CREATE TABLE stalls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  stall_number TEXT NOT NULL,
  zone TEXT, -- "Floor 1" or "Floor 2"
  base_rent NUMERIC(12, 2) NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exhibition_id, stall_number)
);

-- Stall layouts table (one row per stall)
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

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  status lead_status DEFAULT 'new',
  interested_size TEXT,
  interested_zone TEXT,
  notes TEXT,
  created_by UUID, -- user_id, nullable
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table (simplified - no amount_paid, payment_status)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  transaction_number TEXT NOT NULL,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  total_amount NUMERIC(12, 2) NOT NULL,
  notes TEXT,
  created_by UUID, -- user_id, nullable
  cancelled BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exhibition_id, transaction_number)
);

-- Transaction items table
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_type item_type NOT NULL,
  stall_id UUID REFERENCES stalls(id) ON DELETE RESTRICT,
  service_id UUID, -- Will reference services table
  item_name TEXT NOT NULL,
  size TEXT, -- Display only, not used for calculations
  base_price NUMERIC(12, 2) NOT NULL,
  addon_price NUMERIC(12, 2) DEFAULT 0,
  final_price NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
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

-- Add foreign key for service_id in transaction_items
ALTER TABLE transaction_items 
  ADD CONSTRAINT transaction_items_service_id_fkey 
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT;

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_mode payment_mode NOT NULL,
  account_id UUID, -- Will reference accounts table
  reference_id TEXT,
  payment_date DATE NOT NULL,
  recorded_by UUID, -- user_id, nullable
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table (shared across exhibitions, no exhibition_id)
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

-- Add foreign key for account_id in payments
ALTER TABLE payments 
  ADD CONSTRAINT payments_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;

-- Service allocations table
CREATE TABLE service_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  stall_id UUID NOT NULL REFERENCES stalls(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (for admin/maintainer roles)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create indexes for performance
CREATE INDEX idx_stalls_exhibition_id ON stalls(exhibition_id);
CREATE INDEX idx_stalls_stall_number ON stalls(stall_number);
CREATE INDEX idx_stall_layouts_stall_id ON stall_layouts(stall_id);
CREATE INDEX idx_leads_exhibition_id ON leads(exhibition_id);
CREATE INDEX idx_transactions_exhibition_id ON transactions(exhibition_id);
CREATE INDEX idx_transactions_lead_id ON transactions(lead_id);
CREATE INDEX idx_transactions_transaction_number ON transactions(transaction_number);
CREATE INDEX idx_transaction_items_exhibition_id ON transaction_items(exhibition_id);
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_stall_id ON transaction_items(stall_id);
CREATE INDEX idx_transaction_items_service_id ON transaction_items(service_id);
CREATE INDEX idx_payments_exhibition_id ON payments(exhibition_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_services_exhibition_id ON services(exhibition_id);
CREATE INDEX idx_service_allocations_exhibition_id ON service_allocations(exhibition_id);
CREATE INDEX idx_service_allocations_stall_id ON service_allocations(stall_id);
CREATE INDEX idx_service_allocations_service_id ON service_allocations(service_id);
CREATE INDEX idx_service_allocations_transaction_id ON service_allocations(transaction_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
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
