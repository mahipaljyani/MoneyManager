CREATE TABLE loans (
    id TEXT NOT NULL PRIMARY KEY,
    borrower_name TEXT NOT NULL,
    amount_lent REAL NOT NULL,
    amount_repaid REAL DEFAULT 0,
    date_lent TEXT NOT NULL,
    expected_repayment_date TEXT,
    status TEXT NOT NULL, -- 'outstanding' or 'repaid'
    notes TEXT,
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
