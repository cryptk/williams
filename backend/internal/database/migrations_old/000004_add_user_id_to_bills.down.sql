-- Drop index first
DROP INDEX IF EXISTS idx_bills_user_id;

-- Note: SQLite doesn't support DROP COLUMN directly in all versions
-- For SQLite, you would need to recreate the table without the column
-- For simplicity in this migration, we'll leave the column as optional
