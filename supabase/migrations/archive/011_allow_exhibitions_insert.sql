-- ============================================
-- Allow Exhibitions Insert/Update/Delete (No Auth Required)
-- ============================================
-- This migration makes the exhibitions table allow all operations without requiring admin role
-- Run this if you want to create/edit/delete exhibitions without authentication setup
-- ============================================

-- Drop the restrictive policies
DROP POLICY IF EXISTS "exhibitions_insert_admin" ON exhibitions;
DROP POLICY IF EXISTS "exhibitions_update_admin" ON exhibitions;

-- Create permissive policies (allows all operations for now)
CREATE POLICY "exhibitions_insert_all"
  ON exhibitions FOR INSERT
  WITH CHECK (true);  -- Allow all inserts (no auth check)

CREATE POLICY "exhibitions_update_all"
  ON exhibitions FOR UPDATE
  USING (true)  -- Allow all updates
  WITH CHECK (true);

-- Add delete policy (was missing)
CREATE POLICY "exhibitions_delete_all"
  ON exhibitions FOR DELETE
  USING (true);  -- Allow all deletes

-- ============================================
-- END OF MIGRATION
-- ============================================
-- After running this migration, you can:
-- - Create exhibitions without admin authentication
-- - Update exhibitions without admin authentication
-- - Delete exhibitions without admin authentication
-- ============================================
