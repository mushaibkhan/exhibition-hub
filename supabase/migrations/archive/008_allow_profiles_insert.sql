-- ============================================
-- Allow Profiles Insert Without Admin Check
-- ============================================
-- Since authentication is not yet implemented, we need to allow
-- profile inserts without requiring admin status.
-- This is a temporary measure until authentication is set up.
-- ============================================

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;

-- Create a more permissive insert policy
-- For now, allow any authenticated user to insert profiles
-- When authentication is implemented, you can make this more restrictive
CREATE POLICY "profiles_insert_authenticated"
  ON profiles FOR INSERT
  WITH CHECK (true);  -- Allow all inserts for now (no auth check)

-- Alternative: If you want to restrict to authenticated users only:
-- CREATE POLICY "profiles_insert_authenticated"
--   ON profiles FOR INSERT
--   WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- Note: Once authentication is implemented, you can:
-- 1. Change this policy to require admin status
-- 2. Or use the is_current_user_admin() function
-- ============================================
