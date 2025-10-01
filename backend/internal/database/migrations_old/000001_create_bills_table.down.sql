-- Drop indexes first
DROP INDEX IF EXISTS idx_bills_category;
DROP INDEX IF EXISTS idx_bills_is_paid;
DROP INDEX IF EXISTS idx_bills_due_date;

-- Drop bills table
DROP TABLE IF EXISTS bills;
