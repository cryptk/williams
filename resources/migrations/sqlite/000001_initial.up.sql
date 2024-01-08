CREATE TABLE bills (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    amount FLOAT,
    due INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    archived_at DATETIME DEFAULT NULL
);