-- ============================================
-- Seed Test Users for Testing
-- ============================================
-- Paste this into Supabase SQL Editor to add sample users
-- ============================================

-- Insert test profiles
INSERT INTO profiles (id, email, full_name, phone, is_active, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100'::uuid, 'admin@expo.com', 'Admin User', '+91 9876543210', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440101'::uuid, 'maintainer1@expo.com', 'Sanjay Agarwal', '+91 9876543211', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440102'::uuid, 'maintainer2@expo.com', 'Dilip Kumar', '+91 9876543212', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440103'::uuid, 'user1@expo.com', 'Rajesh Sharma', '+91 9876543213', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440104'::uuid, 'user2@expo.com', 'Priya Patel', '+91 9876543214', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test user roles
INSERT INTO user_roles (user_id, role)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100'::uuid, 'admin'::app_role),
  ('550e8400-e29b-41d4-a716-446655440101'::uuid, 'maintainer'::app_role),
  ('550e8400-e29b-41d4-a716-446655440102'::uuid, 'maintainer'::app_role),
  ('550e8400-e29b-41d4-a716-446655440103'::uuid, 'maintainer'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- Test Users Created:
-- ============================================
-- 1. Admin User (admin@expo.com) - Admin role
-- 2. Sanjay Agarwal (maintainer1@expo.com) - Maintainer role
-- 3. Dilip Kumar (maintainer2@expo.com) - Maintainer role
-- 4. Rajesh Sharma (user1@expo.com) - Maintainer role, Active
-- 5. Priya Patel (user2@expo.com) - No role, Inactive
-- ============================================
