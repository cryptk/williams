-- Change bills table to use due_day (1-31) instead of due_date and next_due_date

-- SQLite doesn't support modifying columns directly, so we need to recreate the table
CREATE TABLE bills_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_day INTEGER NOT NULL CHECK(due_day >= 1 AND due_day <= 31),
    category TEXT,
    is_recurring INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data from old table, extracting day from due_date
INSERT INTO bills_new (id, user_id, name, amount, due_day, category, is_recurring, notes, created_at, updated_at)
SELECT 
    id, 
    user_id, 
    name, 
    amount, 
    CAST(strftime('%d', due_date) AS INTEGER) as due_day,
    category, 
    is_recurring, 
    notes, 
    created_at, 
    updated_at
FROM bills;

-- Drop old table
DROP TABLE bills;

-- Rename new table
ALTER TABLE bills_new RENAME TO bills;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_bills_due_day ON bills(due_day);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_is_recurring ON bills(is_recurring);
