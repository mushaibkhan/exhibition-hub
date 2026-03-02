-- Migration: Add quotation support to leads table
-- Date: 2026-01-31
-- Description: Adds fields for stall selection and formal quotations

-- Remove old interested_size column and add new quotation columns
ALTER TABLE leads
  DROP COLUMN IF EXISTS interested_size,
  ADD COLUMN IF NOT EXISTS interested_stalls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS quoted_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quoted_gst BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS quoted_cgst NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quoted_sgst NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quoted_total NUMERIC(12, 2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN leads.interested_stalls IS 'Array of stall IDs the lead is interested in';
COMMENT ON COLUMN leads.quoted_amount IS 'Base amount quoted (sum of stall prices)';
COMMENT ON COLUMN leads.quoted_gst IS 'Whether GST is included in the quotation';
COMMENT ON COLUMN leads.quoted_cgst IS 'CGST amount (9% of quoted_amount)';
COMMENT ON COLUMN leads.quoted_sgst IS 'SGST amount (9% of quoted_amount)';
COMMENT ON COLUMN leads.quoted_total IS 'Total quoted amount including GST if applicable';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_interested_stalls ON leads USING GIN (interested_stalls);
