-- Revert bills table changes - add is_paid back, remove next_due_date

CREATE TABLE bills_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date DATETIME NOT NULL,
    category TEXT,
    is_paid INTEGER DEFAULT 0,
    is_recurring INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data back
INSERT INTO bills_new (id, user_id, name, amount, due_date, category, is_paid, is_recurring, notes, created_at, updated_at)
SELECT id, user_id, name, amount, due_date, category, 0 as is_paid, is_recurring, notes, created_at, updated_at
FROM bills;

-- Drop modified table
DROP TABLE bills;

-- Rename back
ALTER TABLE bills_new RENAME TO bills;

-- Recreate original indexes
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_is_paid ON bills(is_paid);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
