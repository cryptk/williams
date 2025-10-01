-- Drop payments table
DROP INDEX IF EXISTS idx_payments_payment_date;
DROP INDEX IF EXISTS idx_payments_bill_id;
DROP TABLE IF EXISTS payments;
