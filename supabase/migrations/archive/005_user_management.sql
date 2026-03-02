-- ============================================
-- User Management Schema
-- ============================================
-- This migration adds user profiles and user management capabilities
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Create Profiles Table
-- ============================================
-- This table stores additional user information beyond auth.users
-- It references auth.users.id for authentication integration
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Add Foreign Key Constraints
-- ============================================
-- Add foreign key constraints for user references in existing tables

-- Leads.created_by -> profiles.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leads_created_by_fkey'
  ) THEN
    ALTER TABLE leads 
      ADD CONSTRAINT leads_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Transactions.created_by -> profiles.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_created_by_fkey'
  ) THEN
    ALTER TABLE transactions 
      ADD CONSTRAINT transactions_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Payments.recorded_by -> profiles.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_recorded_by_fkey'
  ) THEN
    ALTER TABLE payments 
      ADD CONSTRAINT payments_recorded_by_fkey 
      FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 3. Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_recorded_by ON payments(recorded_by);

-- ============================================
-- 4. Add updated_at Trigger for Profiles
-- ============================================
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Function to Sync Email from auth.users
-- ============================================
-- This function keeps the email in sync with auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email in profiles when auth.users email changes
  IF TG_OP = 'UPDATE' AND OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE profiles 
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To sync email from auth.users, you would need to create a trigger
-- on auth.users, but that requires superuser privileges. Instead, handle
-- email sync in your application code or use Supabase Database Webhooks.

-- ============================================
-- 6. Function to Auto-Create Profile on User Signup
-- ============================================
-- This function automatically creates a profile when a user signs up
-- It should be called from your authentication flow (Supabase Auth hooks)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To use this trigger, you need to set it up in Supabase Dashboard:
-- Go to Database > Functions > handle_new_user
-- Then in Authentication > Hooks, create a trigger that calls this function
-- Or use Supabase Edge Functions / Database Webhooks

-- ============================================
-- 7. Row Level Security (RLS) Policies for Profiles
-- ============================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can view all active profiles (for dropdowns, etc.)
CREATE POLICY "profiles_select_active"
  ON profiles FOR SELECT
  USING (is_active = TRUE);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admins can insert new profiles (for user management)
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Only admins can update other users' profiles
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Only admins can delete profiles (deactivate instead of delete)
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- ============================================
-- 8. Helper View: User with Role
-- ============================================
-- This view combines profile information with user roles
CREATE OR REPLACE VIEW user_with_roles AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.is_active,
  p.last_login_at,
  p.created_at,
  p.updated_at,
  COALESCE(
    (SELECT array_agg(ur.role::text) 
     FROM user_roles ur 
     WHERE ur.user_id = p.id),
    ARRAY[]::text[]
  ) as roles
FROM profiles p;

-- Grant access to the view
GRANT SELECT ON user_with_roles TO authenticated;

-- ============================================
-- 9. Helper Function: Get User Display Name
-- ============================================
-- Returns a user-friendly name for display
CREATE OR REPLACE FUNCTION get_user_display_name(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  display_name TEXT;
BEGIN
  SELECT COALESCE(full_name, email, 'Unknown User')
  INTO display_name
  FROM profiles
  WHERE id = user_id;
  
  RETURN display_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 10. Helper Function: Check if User is Admin
-- ============================================
-- Returns true if the user has admin role
CREATE OR REPLACE FUNCTION is_user_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id AND role = 'admin'::app_role
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 11. Update User Roles RLS Policies
-- ============================================
-- Allow admins to view all user roles (for user management)
-- Only drop and recreate if policy doesn't exist or needs updating
DO $$ 
BEGIN
  -- Drop existing policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles' 
    AND policyname = 'user_roles_select_all_admin'
  ) THEN
    DROP POLICY "user_roles_select_all_admin" ON user_roles;
  END IF;
END $$;

CREATE POLICY "user_roles_select_all_admin"
  ON user_roles FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Allow admins to update user roles
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles' 
    AND policyname = 'user_roles_update_admin'
  ) THEN
    DROP POLICY "user_roles_update_admin" ON user_roles;
  END IF;
END $$;

CREATE POLICY "user_roles_update_admin"
  ON user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Allow admins to delete user roles
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_roles' 
    AND policyname = 'user_roles_delete_admin'
  ) THEN
    DROP POLICY "user_roles_delete_admin" ON user_roles;
  END IF;
END $$;

CREATE POLICY "user_roles_delete_admin"
  ON user_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- ============================================
-- 12. Comments for Documentation
-- ============================================
COMMENT ON TABLE profiles IS 'User profiles extending auth.users with additional information';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id - the authentication user ID';
COMMENT ON COLUMN profiles.email IS 'User email (synced from auth.users)';
COMMENT ON COLUMN profiles.full_name IS 'User full name for display';
COMMENT ON COLUMN profiles.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN profiles.last_login_at IS 'Timestamp of last login (updated by application)';

COMMENT ON COLUMN leads.created_by IS 'User ID who created this lead';
COMMENT ON COLUMN transactions.created_by IS 'User ID who created this transaction';
COMMENT ON COLUMN payments.recorded_by IS 'User ID who recorded this payment';

-- ============================================
-- END OF MIGRATION
-- ============================================
-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Set up authentication hooks to call handle_new_user() on signup
-- 3. Update your application code to:
--    - Set created_by when creating leads/transactions
--    - Set recorded_by when recording payments
--    - Use profiles table for user management UI
-- ============================================
