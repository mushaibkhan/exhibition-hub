-- ============================================
-- Make profiles.id foreign key optional
-- ============================================
-- This allows creating profiles without auth.users
-- Run this if you want to use profiles without authentication for now
-- ============================================

-- Drop the existing foreign key constraint
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Note: The profiles.id will still be a UUID, but it won't be required
-- to reference auth.users. When you implement authentication later,
-- you can recreate the foreign key constraint.

-- ============================================
-- To re-enable the foreign key later (when auth is implemented):
-- ============================================
-- ALTER TABLE profiles 
--   ADD CONSTRAINT profiles_id_fkey 
--   FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ============================================
