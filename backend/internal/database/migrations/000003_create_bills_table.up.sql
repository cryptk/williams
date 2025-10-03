-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    recurrence_days INTEGER NOT NULL CHECK(recurrence_days >= 1),
    category_id TEXT NULL,
    recurrence_type TEXT DEFAULT 'none' CHECK(recurrence_type IN ('none', 'fixed_date', 'interval')),
    start_date DATETIME NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_recurrence_days ON bills(recurrence_days);
CREATE INDEX IF NOT EXISTS idx_bills_category_id ON bills(category_id);
CREATE INDEX IF NOT EXISTS idx_bills_recurrence_type ON bills(recurrence_type);
