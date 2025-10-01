-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, color) VALUES
    ('cat_utilities', 'Utilities', '#3498db'),
    ('cat_rent', 'Rent', '#e74c3c'),
    ('cat_insurance', 'Insurance', '#2ecc71'),
    ('cat_subscriptions', 'Subscriptions', '#f39c12'),
    ('cat_other', 'Other', '#95a5a6');
