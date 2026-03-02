-- Migration: Add target_stall_count for quantity-based interest
-- This allows leads to express interest in a number of stalls without specifying exact locations

-- Add target_stall_count column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS target_stall_count INTEGER DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN leads.target_stall_count IS 'Number of stalls the lead is interested in when specific stalls have not been selected yet';
