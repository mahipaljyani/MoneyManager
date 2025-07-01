CREATE TABLE categories (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'income' or 'expense'
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
