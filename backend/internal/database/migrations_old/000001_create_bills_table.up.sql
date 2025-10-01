-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date DATETIME NOT NULL,
    category TEXT,
    is_paid INTEGER DEFAULT 0,
    is_recurring INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on due_date for faster queries
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);

-- Create index on is_paid for filtering
CREATE INDEX IF NOT EXISTS idx_bills_is_paid ON bills(is_paid);

-- Create index on category for grouping
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
