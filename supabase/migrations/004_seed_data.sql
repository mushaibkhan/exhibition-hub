-- Seed exhibitions
-- Using fixed UUIDs for exhibition IDs (matching the UUID schema)
INSERT INTO exhibitions (id, name, short_name, description, start_date, end_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Business - Kings Crown', 'KC Business', 'Premier business exhibition showcasing industry leaders', '2024-03-15', '2024-03-18'),
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Education - Kings Crown', 'KC Education', 'Educational institutions and career opportunities fair', '2024-04-10', '2024-04-12'),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Education - Old City', 'Old City Education', 'Traditional and modern business showcase at Charminar', '2024-05-20', '2024-05-23');

-- Note: Stalls and layouts will be generated via application code or a separate script
-- This migration just sets up the exhibitions

-- Seed some default accounts
INSERT INTO accounts (id, name, upi_details, bank_details, is_active) VALUES
  (uuid_generate_v4(), 'Main Cash Account', NULL, 'HDFC Bank - Account: 1234567890', TRUE),
  (uuid_generate_v4(), 'UPI Collection', 'upi@exhibition.com', NULL, TRUE),
  (uuid_generate_v4(), 'Bank Transfer', NULL, 'ICICI Bank - Account: 9876543210', TRUE);
