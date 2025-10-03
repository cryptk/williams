-- Rollback: Remove user_id from payments table by recreating without it
CREATE TABLE IF NOT EXISTS payments_rollback (
    id TEXT PRIMARY KEY,
    bill_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_date DATETIME NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

-- Copy data from current table to rollback table (excluding user_id)
INSERT INTO payments_rollback (id, bill_id, amount, payment_date, notes, created_at)
SELECT id, bill_id, amount, payment_date, notes, created_at
FROM payments;

-- Drop current table
DROP TABLE payments;

-- Rename rollback table to original name
ALTER TABLE payments_rollback RENAME TO payments;

-- Recreate original indexes
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
