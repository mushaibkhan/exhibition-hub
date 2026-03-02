-- Enable Row Level Security on all exhibition-scoped tables
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stall_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Exhibitions: Allow all authenticated users to read, only admins to modify
CREATE POLICY "exhibitions_select_all"
  ON exhibitions FOR SELECT
  USING (true);

CREATE POLICY "exhibitions_insert_admin"
  ON exhibitions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "exhibitions_update_admin"
  ON exhibitions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Stalls: Filter by exhibition_id (set via session variable or client-side)
-- For now, allow all reads/writes - we'll filter client-side
-- In production, you'd set: SET app.current_exhibition_id = 'uuid';
CREATE POLICY "stalls_select_all"
  ON stalls FOR SELECT
  USING (true);

CREATE POLICY "stalls_insert_all"
  ON stalls FOR INSERT
  WITH CHECK (true);

CREATE POLICY "stalls_update_all"
  ON stalls FOR UPDATE
  USING (true);

CREATE POLICY "stalls_delete_all"
  ON stalls FOR DELETE
  USING (true);

-- Stall layouts: Same as stalls
CREATE POLICY "stall_layouts_select_all"
  ON stall_layouts FOR SELECT
  USING (true);

CREATE POLICY "stall_layouts_insert_all"
  ON stall_layouts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "stall_layouts_update_all"
  ON stall_layouts FOR UPDATE
  USING (true);

CREATE POLICY "stall_layouts_delete_all"
  ON stall_layouts FOR DELETE
  USING (true);

-- Leads: Filter by exhibition_id
CREATE POLICY "leads_select_all"
  ON leads FOR SELECT
  USING (true);

CREATE POLICY "leads_insert_all"
  ON leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "leads_update_all"
  ON leads FOR UPDATE
  USING (true);

CREATE POLICY "leads_delete_all"
  ON leads FOR DELETE
  USING (true);

-- Transactions: Filter by exhibition_id
CREATE POLICY "transactions_select_all"
  ON transactions FOR SELECT
  USING (true);

CREATE POLICY "transactions_insert_all"
  ON transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "transactions_update_all"
  ON transactions FOR UPDATE
  USING (true);

CREATE POLICY "transactions_delete_all"
  ON transactions FOR DELETE
  USING (true);

-- Transaction items: Filter by exhibition_id
CREATE POLICY "transaction_items_select_all"
  ON transaction_items FOR SELECT
  USING (true);

CREATE POLICY "transaction_items_insert_all"
  ON transaction_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "transaction_items_update_all"
  ON transaction_items FOR UPDATE
  USING (true);

CREATE POLICY "transaction_items_delete_all"
  ON transaction_items FOR DELETE
  USING (true);

-- Payments: Filter by exhibition_id
CREATE POLICY "payments_select_all"
  ON payments FOR SELECT
  USING (true);

CREATE POLICY "payments_insert_all"
  ON payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "payments_update_all"
  ON payments FOR UPDATE
  USING (true);

CREATE POLICY "payments_delete_all"
  ON payments FOR DELETE
  USING (true);

-- Services: Filter by exhibition_id
CREATE POLICY "services_select_all"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "services_insert_all"
  ON services FOR INSERT
  WITH CHECK (true);

CREATE POLICY "services_update_all"
  ON services FOR UPDATE
  USING (true);

CREATE POLICY "services_delete_all"
  ON services FOR DELETE
  USING (true);

-- Service allocations: Filter by exhibition_id
CREATE POLICY "service_allocations_select_all"
  ON service_allocations FOR SELECT
  USING (true);

CREATE POLICY "service_allocations_insert_all"
  ON service_allocations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "service_allocations_update_all"
  ON service_allocations FOR UPDATE
  USING (true);

CREATE POLICY "service_allocations_delete_all"
  ON service_allocations FOR DELETE
  USING (true);

-- Accounts: Shared across exhibitions, allow all
CREATE POLICY "accounts_select_all"
  ON accounts FOR SELECT
  USING (true);

CREATE POLICY "accounts_insert_all"
  ON accounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "accounts_update_all"
  ON accounts FOR UPDATE
  USING (true);

CREATE POLICY "accounts_delete_all"
  ON accounts FOR DELETE
  USING (true);

-- User roles: Users can see their own roles
CREATE POLICY "user_roles_select_own"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_insert_admin"
  ON user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Note: For production, you would use session variables for exhibition filtering:
-- SET LOCAL app.current_exhibition_id = 'uuid-here';
-- Then policies would use: USING (exhibition_id = current_setting('app.current_exhibition_id', true)::uuid)
-- For now, we'll filter client-side in the application
