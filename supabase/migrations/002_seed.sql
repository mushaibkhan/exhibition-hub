-- ============================================
-- Exhibition Hub: Seed Data
-- Comprehensive demo data for KC Business
-- ============================================

-- ============================================
-- Exhibitions
-- ============================================
INSERT INTO exhibitions (id, name, short_name, description, start_date, end_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Business - Kings Crown', 'KC Business', 'Premier business exhibition showcasing industry leaders', '2024-03-15', '2024-03-18'),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Education - Kings Crown', 'KC Education', 'Educational institutions and career opportunities fair', '2024-04-10', '2024-04-12'),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Education - Old City', 'Old City Education', 'Traditional and modern business showcase at Charminar', '2024-05-20', '2024-05-23')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Accounts (fixed UUIDs)
-- ============================================
INSERT INTO accounts (id, name, upi_details, bank_details, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440800'::uuid, 'Main Cash Account', NULL, 'HDFC Bank - Account: 1234567890', TRUE),
  ('550e8400-e29b-41d4-a716-446655440801'::uuid, 'UPI Collection', 'upi@exhibition.com', NULL, TRUE),
  ('550e8400-e29b-41d4-a716-446655440802'::uuid, 'Bank Transfer', NULL, 'ICICI Bank - Account: 9876543210', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Profiles (passwords: admin123, maintain123, maintain123, user123, user123)
-- ============================================
INSERT INTO profiles (id, email, password_hash, full_name, phone, is_active, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440100'::uuid, 'admin@expo.com', '$2b$10$0TGpqW7sIB0bCMc6hUpw.uIj6oxI6CTEyAW8DYd671OMgnEqaF46a', 'Admin User', '+91 9876543210', TRUE, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440101'::uuid, 'maintainer1@expo.com', '$2b$10$wYr0wGv5JPqzhrPU8fd0RO6XvE6Ze4pBJqMvUPa0iLYvk8p5IV4G6', 'Sanjay Agarwal', '+91 9876543211', TRUE, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440102'::uuid, 'maintainer2@expo.com', '$2b$10$wYr0wGv5JPqzhrPU8fd0RO6XvE6Ze4pBJqMvUPa0iLYvk8p5IV4G6', 'Dilip Kumar', '+91 9876543212', TRUE, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440103'::uuid, 'user1@expo.com', '$2b$10$TSTKgfH8WVdHwCHbiVaiOOL.a3zXQWXd/c9U48psTvouG1esKO4RS', 'Rajesh Sharma', '+91 9876543213', TRUE, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440104'::uuid, 'user2@expo.com', '$2b$10$TSTKgfH8WVdHwCHbiVaiOOL.a3zXQWXd/c9U48psTvouG1esKO4RS', 'Priya Patel', '+91 9876543214', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- User Roles
-- ============================================
INSERT INTO user_roles (user_id, role) VALUES
  ('550e8400-e29b-41d4-a716-446655440100'::uuid, 'admin'::app_role),
  ('550e8400-e29b-41d4-a716-446655440101'::uuid, 'maintainer'::app_role),
  ('550e8400-e29b-41d4-a716-446655440102'::uuid, 'maintainer'::app_role),
  ('550e8400-e29b-41d4-a716-446655440103'::uuid, 'maintainer'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- Stalls: Floor 1 (S1-01 to S1-24) for KC Business
-- ============================================
INSERT INTO stalls (id, exhibition_id, stall_number, zone, base_rent, is_blocked, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440200'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-01', 'Floor 1', 18000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440201'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-02', 'Floor 1', 18000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440202'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-03', 'Floor 1', 20000.00, FALSE, 'Corner stall - premium'),
  ('550e8400-e29b-41d4-a716-446655440203'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-04', 'Floor 1', 15000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440204'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-05', 'Floor 1', 15000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440205'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-06', 'Floor 1', 22000.00, FALSE, 'Near entrance'),
  ('550e8400-e29b-41d4-a716-446655440206'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-07', 'Floor 1', 22000.00, FALSE, 'Near entrance'),
  ('550e8400-e29b-41d4-a716-446655440207'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-08', 'Floor 1', 18000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440208'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-09', 'Floor 1', 18000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440209'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-10', 'Floor 1', 25000.00, FALSE, 'Premium corner - main hall'),
  ('550e8400-e29b-41d4-a716-446655440210'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-11', 'Floor 1', 20000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440211'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-12', 'Floor 1', 20000.00, FALSE, NULL);
INSERT INTO stalls (id, exhibition_id, stall_number, zone, base_rent, is_blocked, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440212'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-13', 'Floor 1', 17000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440213'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-14', 'Floor 1', 17000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440214'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-15', 'Floor 1', 19000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440215'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-16', 'Floor 1', 15000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440216'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-17', 'Floor 1', 15000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440217'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-18', 'Floor 1', 21000.00, FALSE, 'Near food court'),
  ('550e8400-e29b-41d4-a716-446655440218'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-19', 'Floor 1', 21000.00, FALSE, 'Near food court'),
  ('550e8400-e29b-41d4-a716-446655440219'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-20', 'Floor 1', 18000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440220'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-21', 'Floor 1', 23000.00, FALSE, 'Premium - near stage'),
  ('550e8400-e29b-41d4-a716-446655440221'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-22', 'Floor 1', 23000.00, FALSE, 'Premium - near stage'),
  ('550e8400-e29b-41d4-a716-446655440222'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-23', 'Floor 1', 16000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440223'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S1-24', 'Floor 1', 16000.00, TRUE, 'Blocked - electrical panel');

-- ============================================
-- Stalls: Floor 2 (S2-01 to S2-12) for KC Business
-- ============================================
INSERT INTO stalls (id, exhibition_id, stall_number, zone, base_rent, is_blocked, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440224'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-01', 'Floor 2', 12000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440225'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-02', 'Floor 2', 12000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440226'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-03', 'Floor 2', 14000.00, FALSE, 'Corner stall'),
  ('550e8400-e29b-41d4-a716-446655440227'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-04', 'Floor 2', 10000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440228'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-05', 'Floor 2', 10000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440229'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-06', 'Floor 2', 15000.00, FALSE, 'Near lift'),
  ('550e8400-e29b-41d4-a716-446655440230'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-07', 'Floor 2', 15000.00, FALSE, 'Near lift'),
  ('550e8400-e29b-41d4-a716-446655440231'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-08', 'Floor 2', 12000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440232'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-09', 'Floor 2', 18000.00, FALSE, 'Premium - balcony view'),
  ('550e8400-e29b-41d4-a716-446655440233'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-10', 'Floor 2', 20000.00, FALSE, 'Premium - double size'),
  ('550e8400-e29b-41d4-a716-446655440234'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-11', 'Floor 2', 13000.00, FALSE, NULL),
  ('550e8400-e29b-41d4-a716-446655440235'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'S2-12', 'Floor 2', 13000.00, FALSE, NULL);

-- ============================================
-- Stall Layouts: Floor 1 (2 rows of 12)
-- Row 0: S1-01..S1-12 at y=0, Row 1: S1-13..S1-24 at y=1
-- ============================================
INSERT INTO stall_layouts (stall_id, position_x, position_y, width, height) VALUES
  ('550e8400-e29b-41d4-a716-446655440200'::uuid, 0, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440201'::uuid, 1, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440202'::uuid, 2, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440203'::uuid, 3, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440204'::uuid, 4, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440205'::uuid, 5, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440206'::uuid, 6, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440207'::uuid, 7, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440208'::uuid, 8, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440209'::uuid, 9, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440210'::uuid, 10, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440211'::uuid, 11, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440212'::uuid, 0, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440213'::uuid, 1, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440214'::uuid, 2, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440215'::uuid, 3, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440216'::uuid, 4, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440217'::uuid, 5, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440218'::uuid, 6, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440219'::uuid, 7, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440220'::uuid, 8, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440221'::uuid, 9, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440222'::uuid, 10, 1, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440223'::uuid, 11, 1, 1, 1)
ON CONFLICT (stall_id) DO NOTHING;

-- ============================================
-- Stall Layouts: Floor 2 (1 row of 12)
-- ============================================
INSERT INTO stall_layouts (stall_id, position_x, position_y, width, height) VALUES
  ('550e8400-e29b-41d4-a716-446655440224'::uuid, 0, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440225'::uuid, 1, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440226'::uuid, 2, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440227'::uuid, 3, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440228'::uuid, 4, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440229'::uuid, 5, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440230'::uuid, 6, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440231'::uuid, 7, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440232'::uuid, 8, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440233'::uuid, 9, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440234'::uuid, 10, 0, 1, 1),
  ('550e8400-e29b-41d4-a716-446655440235'::uuid, 11, 0, 1, 1)
ON CONFLICT (stall_id) DO NOTHING;

-- ============================================
-- Services for KC Business
-- ============================================
INSERT INTO services (id, exhibition_id, name, category, description, price, quantity, sold_quantity, is_unlimited) VALUES
  ('550e8400-e29b-41d4-a716-446655440300'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Premium Signboard', 'signboard'::service_category, 'Large illuminated signboard with custom branding', 5000.00, 50, 3, FALSE),
  ('550e8400-e29b-41d4-a716-446655440301'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Standard Signboard', 'signboard'::service_category, 'Standard printed signboard with name plate', 2500.00, 100, 5, FALSE),
  ('550e8400-e29b-41d4-a716-446655440302'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Food Court Table', 'food_court'::service_category, 'Dedicated table in the food court area with seating', 8000.00, 20, 2, FALSE),
  ('550e8400-e29b-41d4-a716-446655440303'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Gold Sponsorship', 'sponsor'::service_category, 'Gold level sponsorship with logo on all banners and stage backdrop', 50000.00, 5, 1, FALSE),
  ('550e8400-e29b-41d4-a716-446655440304'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Silver Sponsorship', 'sponsor'::service_category, 'Silver level sponsorship with logo on selected banners', 25000.00, 10, 2, FALSE),
  ('550e8400-e29b-41d4-a716-446655440305'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'WiFi Add-on', 'add_on'::service_category, 'Dedicated high-speed WiFi for stall', 1500.00, 100, 8, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Leads for KC Business (15 total)
-- Admin created 8, Maintainer1 created 7
-- ============================================
INSERT INTO leads (id, exhibition_id, name, phone, email, company, status, interested_zone, interested_stalls, target_stall_count, quoted_amount, quoted_gst, quoted_total, notes, created_by, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440400'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Ravi Kumar', '+91 9845012345', 'ravi@ravielectronics.com', 'Ravi Electronics',
   'converted'::lead_status, 'Floor 1', ARRAY['S1-01','S1-02'], 2, 36000.00, FALSE, 36000.00,
   'Long-time exhibitor, needs 2 adjacent stalls', '550e8400-e29b-41d4-a716-446655440100'::uuid, '2024-02-10 09:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440401'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Anita Sharma', '+91 9845012346', 'anita@sharmatextiles.in', 'Sharma Textiles',
   'converted'::lead_status, 'Floor 1', ARRAY['S1-03'], 1, 20000.00, FALSE, 20000.00,
   'Returning exhibitor from last year', '550e8400-e29b-41d4-a716-446655440100'::uuid, '2024-02-11 10:30:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440402'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Imran Khan', '+91 9845012347', 'imran@khanmotors.com', 'Khan Motors',
   'interested'::lead_status, 'Floor 1', ARRAY['S1-06','S1-07'], 2, 44000.00, FALSE, 44000.00,
   'Wants stalls near entrance for automobile display', '550e8400-e29b-41d4-a716-446655440100'::uuid, '2024-02-12 11:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440403'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Meena Patel', '+91 9845012348', 'meena@pateljewellers.com', 'Patel Jewellers',
   'follow_up'::lead_status, 'Floor 1', ARRAY['S1-10'], 1, 25000.00, FALSE, 25000.00,
   'Interested in premium corner, waiting for budget approval', '550e8400-e29b-41d4-a716-446655440100'::uuid, '2024-02-13 14:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440404'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Harpreet Singh', '+91 9845012349', 'harpreet@singhfurniture.com', 'Singh Furniture',
   'new'::lead_status, 'Floor 2', ARRAY['S2-09','S2-10'], 2, 38000.00, FALSE, 38000.00,
   'New lead - wants large display area for furniture', '550e8400-e29b-41d4-a716-446655440100'::uuid, '2024-02-25 09:30:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440405'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Ramesh Gupta', '+91 9845012350', 'ramesh@guptatrading.com', 'Gupta Trading Co',
   'converted'::lead_status, 'Floor 1', ARRAY['S1-05'], 1, 15000.00, FALSE, 15000.00,
   'Small stall for trading samples display', '550e8400-e29b-41d4-a716-446655440100'::uuid, '2024-02-14 10:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440406'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Vikram Mehta', '+91 9845012351', 'vikram@mehtapharma.com', 'Mehta Pharmaceuticals',
   'not_interested'::lead_status, 'Floor 2', ARRAY[]::text[], 0, 0.00, FALSE, 0.00,
   'Budget constraints - will consider next exhibition', '550e8400-e29b-41d4-a716-446655440100'::uuid, '2024-02-15 16:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440407'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Lakshmi Reddy', '+91 9845012352', 'lakshmi@reddyconstruction.in', 'Reddy Construction',
   'interested'::lead_status, 'Floor 1', ARRAY['S1-20','S1-21'], 2, 41000.00, FALSE, 41000.00,
   'Construction company wants demo area', '550e8400-e29b-41d4-a716-446655440101'::uuid, '2024-02-16 09:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440408'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Sunil Joshi', '+91 9845012353', 'sunil@joshihandicrafts.com', 'Joshi Handicrafts',
   'follow_up'::lead_status, 'Floor 2', ARRAY['S2-01','S2-02'], 2, 24000.00, FALSE, 24000.00,
   'Handicraft display - needs wall mounting options', '550e8400-e29b-41d4-a716-446655440101'::uuid, '2024-02-17 11:30:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440409'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Deepak Agarwal', '+91 9845012354', 'deepak@agarwalsweets.com', 'Agarwal Sweets',
   'new'::lead_status, 'Floor 2', ARRAY['S2-06'], 1, 15000.00, FALSE, 15000.00,
   'Food stall near food court preferred', '550e8400-e29b-41d4-a716-446655440101'::uuid, '2024-02-26 10:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440410'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Farah Malik', '+91 9845012355', 'farah@malikfashion.in', 'Malik Fashion',
   'converted'::lead_status, 'Floor 2', ARRAY['S2-03','S2-04'], 2, 24000.00, FALSE, 24000.00,
   'Fashion boutique - needs fitting room space', '550e8400-e29b-41d4-a716-446655440101'::uuid, '2024-02-18 13:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440411'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Ajay Kapoor', '+91 9845012356', 'ajay@kapoorauto.com', 'Kapoor Auto',
   'new'::lead_status, 'Floor 1', ARRAY['S1-11','S1-12'], 2, 40000.00, FALSE, 40000.00,
   'Auto parts dealer - first time exhibitor', '550e8400-e29b-41d4-a716-446655440101'::uuid, '2024-02-27 15:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440412'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Pooja Verma', '+91 9845012357', 'pooja@vermaelectronics.in', 'Verma Electronics',
   'interested'::lead_status, 'Floor 1', ARRAY['S1-08','S1-09'], 2, 36000.00, FALSE, 36000.00,
   'Electronics display with power requirements', '550e8400-e29b-41d4-a716-446655440101'::uuid, '2024-02-19 10:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440413'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Amit Saxena', '+91 9845012358', 'amit@saxenabooks.com', 'Saxena Books',
   'follow_up'::lead_status, 'Floor 2', ARRAY['S2-05'], 1, 10000.00, FALSE, 10000.00,
   'Book stall - wants quiet corner', '550e8400-e29b-41d4-a716-446655440100'::uuid, '2024-02-20 12:00:00+05:30'),

  ('550e8400-e29b-41d4-a716-446655440414'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Lakshmi Iyer', '+91 9845012359', 'lakshmi@iyersilks.com', 'Iyer Silks',
   'converted'::lead_status, 'Floor 1', ARRAY['S1-13','S1-14'], 2, 34000.00, FALSE, 34000.00,
   'Premium silk saree showroom setup', '550e8400-e29b-41d4-a716-446655440101'::uuid, '2024-02-21 09:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Transactions (5 total, linked to converted leads)
-- ============================================

-- TXN 1: Ravi Electronics - 2 stalls (S1-01, S1-02) + Premium Signboard
-- Stall total: 18000+18000=36000, Service: 5000, Grand total: 41000
-- Payment: fully paid (41000)
INSERT INTO transactions (id, exhibition_id, transaction_number, lead_id, total_amount, is_gst, subtotal, cgst_amount, sgst_amount, gst_amount, discount_type, discount_value, discount_amount, notes, created_by, cancelled, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440500'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'TXN-2024-001', '550e8400-e29b-41d4-a716-446655440400'::uuid,
   41000.00, FALSE, 41000.00, 0.00, 0.00, 0.00, NULL, NULL, 0.00,
   'Ravi Electronics - 2 stalls + premium signboard', '550e8400-e29b-41d4-a716-446655440100'::uuid, FALSE, '2024-02-15 10:00:00+05:30')
ON CONFLICT (exhibition_id, transaction_number) DO NOTHING;

-- TXN 2: Sharma Textiles - 1 stall (S1-03) + Standard Signboard + WiFi
-- Stall: 20000, Services: 2500+1500=4000, Grand total: 24000
-- Payment: partial (15000 of 24000)
INSERT INTO transactions (id, exhibition_id, transaction_number, lead_id, total_amount, is_gst, subtotal, cgst_amount, sgst_amount, gst_amount, discount_type, discount_value, discount_amount, notes, created_by, cancelled, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440501'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'TXN-2024-002', '550e8400-e29b-41d4-a716-446655440401'::uuid,
   24000.00, FALSE, 24000.00, 0.00, 0.00, 0.00, NULL, NULL, 0.00,
   'Sharma Textiles - corner stall with signboard and WiFi', '550e8400-e29b-41d4-a716-446655440100'::uuid, FALSE, '2024-02-16 11:30:00+05:30')
ON CONFLICT (exhibition_id, transaction_number) DO NOTHING;

-- TXN 3: Gupta Trading - 1 stall (S1-05)
-- Stall: 15000, Grand total: 15000
-- Payment: fully paid (15000)
INSERT INTO transactions (id, exhibition_id, transaction_number, lead_id, total_amount, is_gst, subtotal, cgst_amount, sgst_amount, gst_amount, discount_type, discount_value, discount_amount, notes, created_by, cancelled, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440502'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'TXN-2024-003', '550e8400-e29b-41d4-a716-446655440405'::uuid,
   15000.00, FALSE, 15000.00, 0.00, 0.00, 0.00, NULL, NULL, 0.00,
   'Gupta Trading - single stall', '550e8400-e29b-41d4-a716-446655440101'::uuid, FALSE, '2024-02-18 14:00:00+05:30')
ON CONFLICT (exhibition_id, transaction_number) DO NOTHING;

-- TXN 4: Malik Fashion - 2 stalls (S2-03, S2-04) + Standard Signboard + Food Court Table
-- Stalls: 14000+10000=24000, Services: 2500+8000=10500, Grand total: 34500
-- Payment: partial (20000 of 34500)
INSERT INTO transactions (id, exhibition_id, transaction_number, lead_id, total_amount, is_gst, subtotal, cgst_amount, sgst_amount, gst_amount, discount_type, discount_value, discount_amount, notes, created_by, cancelled, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440503'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'TXN-2024-004', '550e8400-e29b-41d4-a716-446655440410'::uuid,
   34500.00, FALSE, 34500.00, 0.00, 0.00, 0.00, NULL, NULL, 0.00,
   'Malik Fashion - 2 stalls with signboard and food court', '550e8400-e29b-41d4-a716-446655440101'::uuid, FALSE, '2024-02-22 10:00:00+05:30')
ON CONFLICT (exhibition_id, transaction_number) DO NOTHING;

-- TXN 5: Iyer Silks - 2 stalls (S1-13, S1-14) + Gold Sponsorship + WiFi
-- Stalls: 17000+17000=34000, Services: 50000+1500=51500, Grand total: 85500
-- Payment: partial (50000 of 85500)
INSERT INTO transactions (id, exhibition_id, transaction_number, lead_id, total_amount, is_gst, subtotal, cgst_amount, sgst_amount, gst_amount, discount_type, discount_value, discount_amount, notes, created_by, cancelled, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440504'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'TXN-2024-005', '550e8400-e29b-41d4-a716-446655440414'::uuid,
   85500.00, FALSE, 85500.00, 0.00, 0.00, 0.00, NULL, NULL, 0.00,
   'Iyer Silks - premium setup with Gold sponsorship', '550e8400-e29b-41d4-a716-446655440101'::uuid, FALSE, '2024-02-24 09:30:00+05:30')
ON CONFLICT (exhibition_id, transaction_number) DO NOTHING;

-- ============================================
-- Transaction Items
-- ============================================

-- TXN 1: Ravi Electronics (2 stalls + 1 service)
INSERT INTO transaction_items (id, exhibition_id, transaction_id, item_type, stall_id, service_id, item_name, size, base_price, addon_price, final_price) VALUES
  ('550e8400-e29b-41d4-a716-446655440600'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440500'::uuid, 'stall'::item_type,
   '550e8400-e29b-41d4-a716-446655440200'::uuid, NULL,
   'S1-01', NULL, 18000.00, 0.00, 18000.00),
  ('550e8400-e29b-41d4-a716-446655440601'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440500'::uuid, 'stall'::item_type,
   '550e8400-e29b-41d4-a716-446655440201'::uuid, NULL,
   'S1-02', NULL, 18000.00, 0.00, 18000.00),
  ('550e8400-e29b-41d4-a716-446655440602'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440500'::uuid, 'service'::item_type,
   NULL, '550e8400-e29b-41d4-a716-446655440300'::uuid,
   'Premium Signboard', NULL, 5000.00, 0.00, 5000.00)
ON CONFLICT (id) DO NOTHING;

-- TXN 2: Sharma Textiles (1 stall + 2 services)
INSERT INTO transaction_items (id, exhibition_id, transaction_id, item_type, stall_id, service_id, item_name, size, base_price, addon_price, final_price) VALUES
  ('550e8400-e29b-41d4-a716-446655440603'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440501'::uuid, 'stall'::item_type,
   '550e8400-e29b-41d4-a716-446655440202'::uuid, NULL,
   'S1-03', NULL, 20000.00, 0.00, 20000.00),
  ('550e8400-e29b-41d4-a716-446655440604'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440501'::uuid, 'service'::item_type,
   NULL, '550e8400-e29b-41d4-a716-446655440301'::uuid,
   'Standard Signboard', NULL, 2500.00, 0.00, 2500.00),
  ('550e8400-e29b-41d4-a716-446655440605'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440501'::uuid, 'service'::item_type,
   NULL, '550e8400-e29b-41d4-a716-446655440305'::uuid,
   'WiFi Add-on', NULL, 1500.00, 0.00, 1500.00)
ON CONFLICT (id) DO NOTHING;

-- TXN 3: Gupta Trading (1 stall)
INSERT INTO transaction_items (id, exhibition_id, transaction_id, item_type, stall_id, service_id, item_name, size, base_price, addon_price, final_price) VALUES
  ('550e8400-e29b-41d4-a716-446655440606'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440502'::uuid, 'stall'::item_type,
   '550e8400-e29b-41d4-a716-446655440204'::uuid, NULL,
   'S1-05', NULL, 15000.00, 0.00, 15000.00)
ON CONFLICT (id) DO NOTHING;

-- TXN 4: Malik Fashion (2 stalls + 2 services)
INSERT INTO transaction_items (id, exhibition_id, transaction_id, item_type, stall_id, service_id, item_name, size, base_price, addon_price, final_price) VALUES
  ('550e8400-e29b-41d4-a716-446655440607'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440503'::uuid, 'stall'::item_type,
   '550e8400-e29b-41d4-a716-446655440226'::uuid, NULL,
   'S2-03', NULL, 14000.00, 0.00, 14000.00),
  ('550e8400-e29b-41d4-a716-446655440608'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440503'::uuid, 'stall'::item_type,
   '550e8400-e29b-41d4-a716-446655440227'::uuid, NULL,
   'S2-04', NULL, 10000.00, 0.00, 10000.00),
  ('550e8400-e29b-41d4-a716-446655440609'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440503'::uuid, 'service'::item_type,
   NULL, '550e8400-e29b-41d4-a716-446655440301'::uuid,
   'Standard Signboard', NULL, 2500.00, 0.00, 2500.00),
  ('550e8400-e29b-41d4-a716-446655440610'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440503'::uuid, 'service'::item_type,
   NULL, '550e8400-e29b-41d4-a716-446655440302'::uuid,
   'Food Court Table', NULL, 8000.00, 0.00, 8000.00)
ON CONFLICT (id) DO NOTHING;

-- TXN 5: Iyer Silks (2 stalls + 2 services)
INSERT INTO transaction_items (id, exhibition_id, transaction_id, item_type, stall_id, service_id, item_name, size, base_price, addon_price, final_price) VALUES
  ('550e8400-e29b-41d4-a716-446655440611'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440504'::uuid, 'stall'::item_type,
   '550e8400-e29b-41d4-a716-446655440212'::uuid, NULL,
   'S1-13', NULL, 17000.00, 0.00, 17000.00),
  ('550e8400-e29b-41d4-a716-446655440612'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440504'::uuid, 'stall'::item_type,
   '550e8400-e29b-41d4-a716-446655440213'::uuid, NULL,
   'S1-14', NULL, 17000.00, 0.00, 17000.00),
  ('550e8400-e29b-41d4-a716-446655440613'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440504'::uuid, 'service'::item_type,
   NULL, '550e8400-e29b-41d4-a716-446655440303'::uuid,
   'Gold Sponsorship', NULL, 50000.00, 0.00, 50000.00),
  ('550e8400-e29b-41d4-a716-446655440614'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440504'::uuid, 'service'::item_type,
   NULL, '550e8400-e29b-41d4-a716-446655440305'::uuid,
   'WiFi Add-on', NULL, 1500.00, 0.00, 1500.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Payments
-- ============================================

-- TXN 1: Ravi Electronics - PAID (41000 total)
-- Payment 1: 25000 cash on booking
-- Payment 2: 10000 UPI next day
-- Payment 3: 6000 bank transfer final
INSERT INTO payments (id, exhibition_id, transaction_id, amount, payment_mode, account_id, reference_id, payment_date, recorded_by, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440700'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440500'::uuid,
   25000.00, 'cash'::payment_mode, '550e8400-e29b-41d4-a716-446655440800'::uuid,
   NULL, '2024-02-15', '550e8400-e29b-41d4-a716-446655440100'::uuid, 'Advance cash payment at booking'),
  ('550e8400-e29b-41d4-a716-446655440701'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440500'::uuid,
   10000.00, 'upi'::payment_mode, '550e8400-e29b-41d4-a716-446655440801'::uuid,
   'UPI-REF-20240216-001', '2024-02-16', '550e8400-e29b-41d4-a716-446655440100'::uuid, 'UPI payment - second installment'),
  ('550e8400-e29b-41d4-a716-446655440702'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440500'::uuid,
   6000.00, 'bank'::payment_mode, '550e8400-e29b-41d4-a716-446655440802'::uuid,
   'NEFT-20240220-4521', '2024-02-20', '550e8400-e29b-41d4-a716-446655440101'::uuid, 'Final bank transfer')
ON CONFLICT (id) DO NOTHING;

-- TXN 2: Sharma Textiles - PARTIAL (15000 of 24000)
-- Payment 1: 10000 cash
-- Payment 2: 5000 UPI
INSERT INTO payments (id, exhibition_id, transaction_id, amount, payment_mode, account_id, reference_id, payment_date, recorded_by, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440703'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440501'::uuid,
   10000.00, 'cash'::payment_mode, '550e8400-e29b-41d4-a716-446655440800'::uuid,
   NULL, '2024-02-16', '550e8400-e29b-41d4-a716-446655440100'::uuid, 'Advance payment'),
  ('550e8400-e29b-41d4-a716-446655440704'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440501'::uuid,
   5000.00, 'upi'::payment_mode, '550e8400-e29b-41d4-a716-446655440801'::uuid,
   'UPI-REF-20240220-002', '2024-02-20', '550e8400-e29b-41d4-a716-446655440101'::uuid, 'Second installment via UPI')
ON CONFLICT (id) DO NOTHING;

-- TXN 3: Gupta Trading - PAID (15000 total)
-- Payment 1: 15000 cash (full amount)
INSERT INTO payments (id, exhibition_id, transaction_id, amount, payment_mode, account_id, reference_id, payment_date, recorded_by, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440705'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440502'::uuid,
   15000.00, 'cash'::payment_mode, '550e8400-e29b-41d4-a716-446655440800'::uuid,
   NULL, '2024-02-18', '550e8400-e29b-41d4-a716-446655440101'::uuid, 'Full payment in cash')
ON CONFLICT (id) DO NOTHING;

-- TXN 4: Malik Fashion - PARTIAL (20000 of 34500)
-- Payment 1: 12000 bank
-- Payment 2: 8000 UPI
INSERT INTO payments (id, exhibition_id, transaction_id, amount, payment_mode, account_id, reference_id, payment_date, recorded_by, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440706'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440503'::uuid,
   12000.00, 'bank'::payment_mode, '550e8400-e29b-41d4-a716-446655440802'::uuid,
   'NEFT-20240222-7891', '2024-02-22', '550e8400-e29b-41d4-a716-446655440101'::uuid, 'Initial bank transfer'),
  ('550e8400-e29b-41d4-a716-446655440707'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440503'::uuid,
   8000.00, 'upi'::payment_mode, '550e8400-e29b-41d4-a716-446655440801'::uuid,
   'UPI-REF-20240225-003', '2024-02-25', '550e8400-e29b-41d4-a716-446655440100'::uuid, 'Partial UPI payment')
ON CONFLICT (id) DO NOTHING;

-- TXN 5: Iyer Silks - PARTIAL (50000 of 85500)
-- Payment 1: 30000 bank
-- Payment 2: 20000 cash
INSERT INTO payments (id, exhibition_id, transaction_id, amount, payment_mode, account_id, reference_id, payment_date, recorded_by, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440708'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440504'::uuid,
   30000.00, 'bank'::payment_mode, '550e8400-e29b-41d4-a716-446655440802'::uuid,
   'NEFT-20240224-1234', '2024-02-24', '550e8400-e29b-41d4-a716-446655440101'::uuid, 'Advance bank payment for Gold sponsor'),
  ('550e8400-e29b-41d4-a716-446655440709'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440504'::uuid,
   20000.00, 'cash'::payment_mode, '550e8400-e29b-41d4-a716-446655440800'::uuid,
   NULL, '2024-02-26', '550e8400-e29b-41d4-a716-446655440100'::uuid, 'Cash payment - second installment')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Service Allocations
-- Link services to stalls via transactions
-- ============================================

-- TXN 1: Ravi Electronics - Premium Signboard allocated to S1-01
INSERT INTO service_allocations (id, exhibition_id, service_id, stall_id, transaction_id, quantity) VALUES
  ('550e8400-e29b-41d4-a716-446655440900'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440300'::uuid,
   '550e8400-e29b-41d4-a716-446655440200'::uuid,
   '550e8400-e29b-41d4-a716-446655440500'::uuid, 1)
ON CONFLICT (id) DO NOTHING;

-- TXN 2: Sharma Textiles - Standard Signboard + WiFi allocated to S1-03
INSERT INTO service_allocations (id, exhibition_id, service_id, stall_id, transaction_id, quantity) VALUES
  ('550e8400-e29b-41d4-a716-446655440901'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440301'::uuid,
   '550e8400-e29b-41d4-a716-446655440202'::uuid,
   '550e8400-e29b-41d4-a716-446655440501'::uuid, 1),
  ('550e8400-e29b-41d4-a716-446655440902'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440305'::uuid,
   '550e8400-e29b-41d4-a716-446655440202'::uuid,
   '550e8400-e29b-41d4-a716-446655440501'::uuid, 1)
ON CONFLICT (id) DO NOTHING;

-- TXN 4: Malik Fashion - Standard Signboard to S2-03, Food Court Table to S2-03
INSERT INTO service_allocations (id, exhibition_id, service_id, stall_id, transaction_id, quantity) VALUES
  ('550e8400-e29b-41d4-a716-446655440903'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440301'::uuid,
   '550e8400-e29b-41d4-a716-446655440226'::uuid,
   '550e8400-e29b-41d4-a716-446655440503'::uuid, 1)
ON CONFLICT (id) DO NOTHING;

-- TXN 4: Malik Fashion - Food Court Table to S2-04
INSERT INTO service_allocations (id, exhibition_id, service_id, stall_id, transaction_id, quantity) VALUES
  ('550e8400-e29b-41d4-a716-446655440904'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440302'::uuid,
   '550e8400-e29b-41d4-a716-446655440227'::uuid,
   '550e8400-e29b-41d4-a716-446655440503'::uuid, 1)
ON CONFLICT (id) DO NOTHING;

-- TXN 5: Iyer Silks - Gold Sponsorship to S1-13, WiFi to S1-14
INSERT INTO service_allocations (id, exhibition_id, service_id, stall_id, transaction_id, quantity) VALUES
  ('550e8400-e29b-41d4-a716-446655440905'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440303'::uuid,
   '550e8400-e29b-41d4-a716-446655440212'::uuid,
   '550e8400-e29b-41d4-a716-446655440504'::uuid, 1),
  ('550e8400-e29b-41d4-a716-446655440906'::uuid, '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '550e8400-e29b-41d4-a716-446655440305'::uuid,
   '550e8400-e29b-41d4-a716-446655440213'::uuid,
   '550e8400-e29b-41d4-a716-446655440504'::uuid, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Expenses for KC Business
-- ============================================
INSERT INTO expenses (id, exhibition_id, expense_date, category, description, amount, payment_mode, account_id, notes, created_by) VALUES
  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '2024-02-01', 'venue'::expense_category, 'Venue booking advance - Convention Center Hall A & B',
   150000.00, 'bank'::payment_mode, '550e8400-e29b-41d4-a716-446655440802'::uuid,
   'Half payment, remaining due before event', '550e8400-e29b-41d4-a716-446655440100'::uuid),

  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '2024-02-10', 'furniture'::expense_category, 'Stall partition boards and tables - 36 stalls',
   85000.00, 'bank'::payment_mode, '550e8400-e29b-41d4-a716-446655440802'::uuid,
   'Vendor: Sharma Furniture Works', '550e8400-e29b-41d4-a716-446655440100'::uuid),

  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '2024-02-12', 'marketing'::expense_category, 'Social media ads + newspaper ad in Deccan Chronicle',
   25000.00, 'upi'::payment_mode, '550e8400-e29b-41d4-a716-446655440801'::uuid,
   'Digital: 15000, Print: 10000', '550e8400-e29b-41d4-a716-446655440101'::uuid),

  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000'::uuid,
   '2024-02-20', 'utilities'::expense_category, 'Electrical setup and generator rental',
   45000.00, 'cash'::payment_mode, '550e8400-e29b-41d4-a716-446655440800'::uuid,
   'Generator backup for 3 days', '550e8400-e29b-41d4-a716-446655440101'::uuid)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Internal Ledger Entries
-- ============================================
INSERT INTO internal_ledger (id, exhibition_id, from_name, to_name, amount, description, status, settled_at, created_at) VALUES
  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Sanjay Agarwal', 'Admin User', 35000.00,
   'Cash collection handover - Feb 15-18 collections', 'settled', '2024-02-19 10:00:00+05:30', '2024-02-18 18:00:00+05:30'),

  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Dilip Kumar', 'Admin User', 20000.00,
   'Cash collection handover - Feb 19-22 collections', 'settled', '2024-02-23 11:00:00+05:30', '2024-02-22 17:00:00+05:30'),

  (uuid_generate_v4(), '550e8400-e29b-41d4-a716-446655440000'::uuid,
   'Sanjay Agarwal', 'Admin User', 15000.00,
   'Cash collection handover - Feb 23-26 collections', 'pending', NULL, '2024-02-26 18:00:00+05:30')
ON CONFLICT (id) DO NOTHING;
