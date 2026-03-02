-- View for derived stall status
CREATE OR REPLACE VIEW stall_status_view AS
SELECT 
  s.id,
  s.exhibition_id,
  s.stall_number,
  s.zone,
  s.base_rent,
  s.is_blocked,
  s.notes,
  s.created_at,
  s.updated_at,
  CASE
    WHEN s.is_blocked THEN 'blocked'::text
    WHEN ti.id IS NULL THEN 'available'::text
    WHEN t.cancelled THEN 'available'::text
    WHEN COALESCE(payment_sum.total_paid, 0) >= t.total_amount THEN 'sold'::text
    WHEN COALESCE(payment_sum.total_paid, 0) > 0 THEN 'pending'::text
    ELSE 'reserved'::text
  END AS status
FROM stalls s
LEFT JOIN transaction_items ti ON ti.stall_id = s.id AND ti.item_type = 'stall'::item_type
LEFT JOIN transactions t ON t.id = ti.transaction_id AND NOT t.cancelled
LEFT JOIN (
  SELECT transaction_id, SUM(amount) as total_paid
  FROM payments
  GROUP BY transaction_id
) payment_sum ON payment_sum.transaction_id = t.id;

-- View for derived transaction summary (amount_paid and payment_status)
CREATE OR REPLACE VIEW transaction_summary_view AS
SELECT 
  t.id,
  t.exhibition_id,
  t.transaction_number,
  t.lead_id,
  t.total_amount,
  t.notes,
  t.created_by,
  t.cancelled,
  t.cancelled_at,
  t.created_at,
  t.updated_at,
  COALESCE(payment_sum.total_paid, 0) as amount_paid,
  CASE
    WHEN t.cancelled THEN 'unpaid'::payment_status
    WHEN COALESCE(payment_sum.total_paid, 0) >= t.total_amount THEN 'paid'::payment_status
    WHEN COALESCE(payment_sum.total_paid, 0) > 0 THEN 'partial'::payment_status
    ELSE 'unpaid'::payment_status
  END as payment_status
FROM transactions t
LEFT JOIN (
  SELECT transaction_id, SUM(amount) as total_paid
  FROM payments
  GROUP BY transaction_id
) payment_sum ON payment_sum.transaction_id = t.id;

-- Helper function to get stall status (for use in queries)
CREATE OR REPLACE FUNCTION get_stall_status(stall_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  result_status TEXT;
BEGIN
  SELECT status INTO result_status
  FROM stall_status_view
  WHERE id = stall_uuid;
  
  RETURN COALESCE(result_status, 'available');
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get transaction payment summary
CREATE OR REPLACE FUNCTION get_transaction_payment_summary(txn_uuid UUID)
RETURNS TABLE(
  amount_paid NUMERIC,
  payment_status payment_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.amount_paid,
    ts.payment_status
  FROM transaction_summary_view ts
  WHERE ts.id = txn_uuid;
END;
$$ LANGUAGE plpgsql STABLE;
