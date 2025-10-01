-- Create categories table (user-specific)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Note: Default categories are now created automatically when a user registers
-- No longer creating global default categories
