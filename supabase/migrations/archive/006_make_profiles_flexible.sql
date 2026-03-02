-- ============================================
-- Make Profiles Table Flexible (No Auth Required)
-- ============================================
-- This migration makes the profiles table work without requiring auth.users
-- Run this if you want to use profiles without authentication setup
-- ============================================

-- Drop the foreign key constraint to auth.users (if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles 
      DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- Note: After running this migration, profiles.id will no longer reference auth.users
-- You can insert profiles with any UUID without needing auth.users to exist first
-- When you're ready to implement authentication, you can add the foreign key back

-- ============================================
-- END OF MIGRATION
-- ============================================
