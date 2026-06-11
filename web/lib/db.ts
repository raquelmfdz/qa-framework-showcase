import Database from 'better-sqlite3';

// Initialize the database connection
export const db = new Database(process.env.DATABASE_FILE || './dev.db');

// 1. Migrations (Table and index creation)
const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    created_at TEXT DEFAULT (datetime('now')),
    name TEXT,
    last_name TEXT,
    zip_code TEXT,
    address TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 50,
    image_url TEXT,
    category TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    guest_token TEXT,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_unique ON cart_items (user_id, product_id) WHERE user_id IS NOT NULL;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS cart_items_guest_product_unique ON cart_items (guest_token, product_id) WHERE guest_token IS NOT NULL;`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_last_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_zip_code TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    total REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );`,
];

// Run database migrations on startup
for (const sql of migrations) {
  db.prepare(sql).run();
}

// Export as default for easier app imports
export default db;
