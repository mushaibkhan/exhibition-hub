-- ============================================
-- Fix Infinite Recursion in user_roles RLS Policies
-- ============================================
-- The issue: Policies on user_roles check if user is admin by querying user_roles,
-- which triggers the same policy, causing infinite recursion.
-- Solution: Use a security definer function that bypasses RLS to check admin status.
-- ============================================

-- Drop all existing user_roles policies
DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_select_all_admin" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_admin" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_admin" ON user_roles;

-- Create a security definer function to check if current user is admin
-- This function bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user has admin role (bypasses RLS)
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'::app_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;

-- ============================================
-- Recreate user_roles policies using the function
-- ============================================

-- Users can view their own roles
CREATE POLICY "user_roles_select_own"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all user roles (uses function to avoid recursion)
CREATE POLICY "user_roles_select_all_admin"
  ON user_roles FOR SELECT
  USING (is_current_user_admin());

-- Only admins can insert new roles (uses function to avoid recursion)
-- Note: For now, this is permissive to allow inserts without auth
-- See migration 009_allow_user_roles_insert.sql for details
CREATE POLICY "user_roles_insert_admin"
  ON user_roles FOR INSERT
  WITH CHECK (true);  -- Allow all inserts for now (will be restricted when auth is added)

-- Only admins can update user roles (uses function to avoid recursion)
CREATE POLICY "user_roles_update_admin"
  ON user_roles FOR UPDATE
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Only admins can delete user roles (uses function to avoid recursion)
CREATE POLICY "user_roles_delete_admin"
  ON user_roles FOR DELETE
  USING (is_current_user_admin());

-- ============================================
-- Also update profiles policies to use the function
-- ============================================

-- Drop existing profiles policies that might have recursion
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

-- Recreate profiles admin policies using the function
-- Note: Insert policy is permissive for now (no auth required)
-- See migration 008_allow_profiles_insert.sql for details
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (true);  -- Allow all inserts for now (will be restricted when auth is added)

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (is_current_user_admin());

-- ============================================
-- END OF MIGRATION
-- ============================================
-- This migration fixes the infinite recursion by:
-- 1. Creating a SECURITY DEFINER function that bypasses RLS
-- 2. Using this function in all policies that need to check admin status
-- 3. This prevents the circular dependency that caused the recursion
-- ============================================
