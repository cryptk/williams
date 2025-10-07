-- Add role column to users table
ALTER TABLE users ADD COLUMN roles TEXT NOT NULL DEFAULT '["user"]';
