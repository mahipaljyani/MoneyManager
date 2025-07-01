CREATE TABLE transactions (
    id TEXT NOT NULL PRIMARY KEY,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    category_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
