-- Add user_id column to payments table
ALTER TABLE payments ADD COLUMN user_id TEXT;

-- Populate user_id from the associated bill
UPDATE payments 
SET user_id = (
    SELECT bills.user_id 
    FROM bills 
    WHERE bills.id = payments.bill_id
);

-- Make user_id NOT NULL after populating
-- Note: SQLite doesn't support ALTER COLUMN, so we need to handle this differently per database

-- For SQLite, we recreate the table with the constraint
-- For MySQL/PostgreSQL, we would use ALTER TABLE payments MODIFY/ALTER COLUMN user_id TEXT NOT NULL

-- SQLite approach: Recreate table with proper constraints
CREATE TABLE IF NOT EXISTS payments_new (
    id TEXT PRIMARY KEY,
    bill_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_date DATETIME NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO payments_new (id, bill_id, user_id, amount, payment_date, notes, created_at)
SELECT id, bill_id, user_id, amount, payment_date, notes, created_at
FROM payments;

-- Drop old table
DROP TABLE payments;

-- Rename new table to original name
ALTER TABLE payments_new RENAME TO payments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
