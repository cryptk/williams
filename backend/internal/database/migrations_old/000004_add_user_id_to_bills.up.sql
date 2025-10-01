-- Add user_id column to bills table
ALTER TABLE bills ADD COLUMN user_id TEXT;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
