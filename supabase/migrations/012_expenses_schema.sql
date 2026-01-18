-- ============================================
-- Expenses Feature: Database Schema
-- ============================================
-- This migration creates the expenses table and related policies
-- ============================================

-- Create expense category enum
CREATE TYPE expense_category AS ENUM ('venue', 'furniture', 'marketing', 'utilities', 'staff', 'misc');

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_mode payment_mode NOT NULL, -- Reuse existing payment_mode enum
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID, -- user_id, nullable for future user tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow all operations for now (similar to payments)
CREATE POLICY "expenses_select_all"
  ON expenses FOR SELECT
  USING (true);

CREATE POLICY "expenses_insert_all"
  ON expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "expenses_update_all"
  ON expenses FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "expenses_delete_all"
  ON expenses FOR DELETE
  USING (true);

-- ============================================
-- END OF MIGRATION
-- ============================================
