import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database(process.env.DATABASE_FILE || './dev.db');

const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    created_at TEXT DEFAULT (datetime('now'))
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

for (const sql of migrations) {
  db.prepare(sql).run();
}

// Add new user columns if they don't exist yet (safe to run on existing DBs)
const userColumns = (db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map(
  (c) => c.name
);
if (!userColumns.includes('name')) db.prepare('ALTER TABLE users ADD COLUMN name TEXT').run();
if (!userColumns.includes('last_name'))
  db.prepare('ALTER TABLE users ADD COLUMN last_name TEXT').run();
if (!userColumns.includes('zip_code'))
  db.prepare('ALTER TABLE users ADD COLUMN zip_code TEXT').run();
if (!userColumns.includes('address')) db.prepare('ALTER TABLE users ADD COLUMN address TEXT').run();

// ─── Products ────────────────────────────────────────────────────────────────

const products = [
  {
    name: 'Mountain Backpack',
    description: 'A rugged pack for day hikes and overnight excursions.',
    price: 79.99,
    stock: 40,
    image_url:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    category: 'Outdoor',
  },
  {
    name: 'Camping Lantern',
    description: 'Compact LED lantern with long runtime and adjustable brightness.',
    price: 39.99,
    stock: 60,
    image_url:
      'https://images.unsplash.com/photo-1473590872239-d6fcc2f309bf?auto=format&fit=crop&w=1200&q=80',
    category: 'Outdoor',
  },
  {
    name: 'Wireless Headphones',
    description: 'Noise-isolating headphones with 24-hour battery life.',
    price: 129.99,
    stock: 35,
    image_url:
      'https://images.unsplash.com/photo-1519666213638-8d95f6a1e95e?auto=format&fit=crop&w=1200&q=80',
    category: 'Electronics',
  },
  {
    name: 'Smart Water Bottle',
    description: 'Keeps drinks cold and tracks hydration with a smart cap.',
    price: 49.99,
    stock: 80,
    image_url:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    category: 'Health',
  },
  {
    name: 'Travel Journal',
    description: 'Hardcover journal with numbered pages and world map.',
    price: 19.99,
    stock: 100,
    image_url:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    category: 'Stationery',
  },
  {
    name: 'Ceramic Coffee Mug',
    description: 'Stylish 14oz mug with insulated handle.',
    price: 24.99,
    stock: 55,
    image_url:
      'https://images.unsplash.com/photo-1513682129705-3d1d56d6995f?auto=format&fit=crop&w=1200&q=80',
    category: 'Home',
  },
  {
    name: 'Yoga Mat',
    description: 'Eco-friendly mat with non-slip surface.',
    price: 34.99,
    stock: 70,
    image_url:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    category: 'Fitness',
  },
  {
    name: 'Desk Organizer',
    description: 'A set of compartments to keep your workspace tidy.',
    price: 29.99,
    stock: 90,
    image_url:
      'https://images.unsplash.com/photo-1517059224940-d4af9eec41e9?auto=format&fit=crop&w=1200&q=80',
    category: 'Office',
  },
  {
    name: 'Travel Pillow',
    description: 'Memory foam pillow with washable cover.',
    price: 27.99,
    stock: 65,
    image_url:
      'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=1200&q=80',
    category: 'Travel',
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Compact speaker with deep bass and wireless pairing.',
    price: 59.99,
    stock: 45,
    image_url:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
    category: 'Audio',
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight shoes designed for daily training runs.',
    price: 99.99,
    stock: 50,
    image_url:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    category: 'Fitness',
  },
  {
    name: 'Minimalist Wallet',
    description: 'Slim wallet that holds cards and cash without bulk.',
    price: 22.99,
    stock: 75,
    image_url:
      'https://images.unsplash.com/photo-1512499617640-c2f999018b72?auto=format&fit=crop&w=1200&q=80',
    category: 'Accessories',
  },
];

const insertProduct = db.prepare(
  'INSERT INTO products (name, description, price, stock, image_url, category) VALUES (?, ?, ?, ?, ?, ?)'
);
const updateProduct = db.prepare(
  'UPDATE products SET description = ?, price = ?, stock = ?, image_url = ?, category = ? WHERE id = ?'
);

for (const product of products) {
  const existing = db
    .prepare('SELECT id, image_url FROM products WHERE name = ?')
    .get(product.name) as { id: number; image_url: string } | undefined;
  if (!existing) {
    insertProduct.run(
      product.name,
      product.description,
      product.price,
      product.stock,
      product.image_url,
      product.category
    );
  } else if (existing.image_url !== product.image_url) {
    updateProduct.run(
      product.description,
      product.price,
      product.stock,
      product.image_url,
      product.category,
      existing.id
    );
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

const userCount = (db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number })
  .count;

if (userCount === 0) {
  const passwordHash = bcrypt.hashSync('Password1!', 10);

  db.prepare(
    'INSERT INTO users (email, password_hash, role, name, last_name, zip_code, address) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    'admin@example.com',
    passwordHash,
    'admin',
    'Admin',
    'McAdminface',
    '00001',
    '1 Control Panel Avenue, Dashboard City'
  );

  db.prepare(
    'INSERT INTO users (email, password_hash, role, name, last_name, zip_code, address) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    'user@example.com',
    passwordHash,
    'USER',
    'Regular',
    'McUserton',
    '12345',
    '42 Ordinary Street, Normaltown'
  );
} else {
  // If users already exist but were seeded without the new fields, backfill them
  db.prepare(
    `UPDATE users SET name = 'Admin', last_name = 'McAdminface', zip_code = '00001',
     address = '1 Control Panel Avenue, Dashboard City'
     WHERE email = 'admin@example.com' AND (name IS NULL OR name = '')`
  ).run();

  db.prepare(
    `UPDATE users SET name = 'Regular', last_name = 'McUserton', zip_code = '12345',
     address = '42 Ordinary Street, Normaltown'
     WHERE email = 'user@example.com' AND (name IS NULL OR name = '')`
  ).run();
}

export { db };
