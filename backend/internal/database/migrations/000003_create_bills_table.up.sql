-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_day INTEGER NOT NULL CHECK(due_day >= 1 AND due_day <= 31),
    category_id TEXT NULL,
    is_recurring INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_day ON bills(due_day);
CREATE INDEX IF NOT EXISTS idx_bills_category_id ON bills(category_id);
CREATE INDEX IF NOT EXISTS idx_bills_is_recurring ON bills(is_recurring);
