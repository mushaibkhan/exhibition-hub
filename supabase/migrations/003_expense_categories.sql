-- ============================================
-- Expense categories: user-defined per exhibition
-- ============================================

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exhibition_id, name)
);

-- Seed default categories for all existing exhibitions
INSERT INTO expense_categories (exhibition_id, name)
  SELECT id, unnest(ARRAY['Venue','Furniture','Marketing','Utilities','Staff','Misc']) FROM exhibitions
ON CONFLICT (exhibition_id, name) DO NOTHING;

-- Migrate expenses from enum to TEXT (store category display name)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_text TEXT;
UPDATE expenses SET category_text = CASE category::text
  WHEN 'venue' THEN 'Venue'
  WHEN 'furniture' THEN 'Furniture'
  WHEN 'marketing' THEN 'Marketing'
  WHEN 'utilities' THEN 'Utilities'
  WHEN 'staff' THEN 'Staff'
  WHEN 'misc' THEN 'Misc'
  ELSE 'Misc'
END WHERE category_text IS NULL;
ALTER TABLE expenses ALTER COLUMN category_text SET NOT NULL;
ALTER TABLE expenses DROP COLUMN IF EXISTS category;
ALTER TABLE expenses RENAME COLUMN category_text TO category;
DROP TYPE IF EXISTS expense_category;

CREATE INDEX IF NOT EXISTS idx_expense_categories_exhibition ON expense_categories(exhibition_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
