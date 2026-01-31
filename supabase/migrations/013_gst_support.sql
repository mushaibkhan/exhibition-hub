-- Migration: Add GST support to transactions table
-- Date: 2026-01-31
-- Description: Adds fields for GST calculation (CGST 9% + SGST 9%)

-- Add GST-related columns to transactions table
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_gst BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) DEFAULT 0;

-- Add check constraint for discount_type
ALTER TABLE transactions
  ADD CONSTRAINT check_discount_type 
  CHECK (discount_type IS NULL OR discount_type IN ('fixed', 'percentage'));

-- Update existing transactions to populate subtotal (same as total_amount for existing records)
UPDATE transactions 
SET subtotal = total_amount,
    is_gst = FALSE,
    gst_amount = 0,
    cgst_amount = 0,
    sgst_amount = 0,
    discount_amount = 0
WHERE subtotal IS NULL OR subtotal = 0;

-- Add comment for documentation
COMMENT ON COLUMN transactions.is_gst IS 'Whether GST (18% = 9% CGST + 9% SGST) is applied to this transaction';
COMMENT ON COLUMN transactions.subtotal IS 'Base amount before GST and after discount';
COMMENT ON COLUMN transactions.cgst_amount IS 'Central GST amount (9% of subtotal)';
COMMENT ON COLUMN transactions.sgst_amount IS 'State GST amount (9% of subtotal)';
COMMENT ON COLUMN transactions.gst_amount IS 'Total GST amount (cgst_amount + sgst_amount)';
COMMENT ON COLUMN transactions.discount_type IS 'Type of discount applied: fixed or percentage';
COMMENT ON COLUMN transactions.discount_value IS 'Discount value (amount in rupees or percentage)';
COMMENT ON COLUMN transactions.discount_amount IS 'Calculated discount amount in rupees';
