-- Revert bills table to use due_date and next_due_date

CREATE TABLE bills_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date DATETIME NOT NULL,
    next_due_date DATETIME,
    category TEXT,
    is_recurring INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data back, creating a due_date from due_day
INSERT INTO bills_new (id, user_id, name, amount, due_date, next_due_date, category, is_recurring, notes, created_at, updated_at)
SELECT 
    id, 
    user_id, 
    name, 
    amount,
    date('now', '+' || due_day || ' days') as due_date,
    NULL as next_due_date,
    category, 
    is_recurring, 
    notes, 
    created_at, 
    updated_at
FROM bills;

-- Drop modified table
DROP TABLE bills;

-- Rename back
ALTER TABLE bills_new RENAME TO bills;

-- Recreate original indexes
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_is_recurring ON bills(is_recurring);
