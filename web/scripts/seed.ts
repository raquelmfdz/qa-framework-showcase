import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database(process.env.DATABASE_FILE || './dev.db');

const sql = db.prepare('SELECT COUNT(*) AS count FROM products');
const productCount = (sql.get() as { count: number }).count;

const products = [
  {
    name: 'Mountain Backpack',
    description: 'A rugged pack for day hikes and overnight excursions.',
    price: 79.99,
    stock: 40,
    image_url:
      'https://images.unsplash.com/photo-1622260614153-03223fb72052?auto=format&fit=crop&w=800&q=80',
    category: 'Outdoor',
  },
  {
    name: 'Camping Lantern',
    description: 'Compact LED lantern with long runtime and adjustable brightness.',
    price: 39.99,
    stock: 60,
    image_url:
      'https://images.unsplash.com/photo-1620354844460-766aa8db3f12?auto=format&fit=crop&w=800&q=80',
    category: 'Outdoor',
  },
  {
    name: 'Wireless Headphones',
    description: 'Noise-isolating headphones with 24-hour battery life.',
    price: 129.99,
    stock: 35,
    image_url:
      'https://images.unsplash.com/photo-1505740106531-4243f3831c78?auto=format&fit=crop&w=800&q=80',
    category: 'Electronics',
  },
  {
    name: 'Smart Water Bottle',
    description: 'Keeps drinks cold and tracks hydration with a smart cap.',
    price: 49.99,
    stock: 80,
    image_url:
      'https://images.unsplash.com/photo-1568395216634-ab1b1e84875?auto=format&fit=crop&w=800&q=80',
    category: 'Health',
  },
  {
    name: 'Travel Journal',
    description: 'Hardcover journal with numbered pages and world map.',
    price: 19.99,
    stock: 100,
    image_url:
      'https://images.unsplash.com/photo-1615826932727-ed9f182ac67e?auto=format&fit=crop&w=800&q=80',
    category: 'Stationery',
  },
  {
    name: 'Ceramic Coffee Mug',
    description: 'Stylish 14oz mug with insulated handle.',
    price: 24.99,
    stock: 55,
    image_url:
      'https://images.unsplash.com/photo-1536936812504-0e77dc3f0b40?auto=format&fit=crop&w=800&q=80',
    category: 'Home',
  },
  {
    name: 'Yoga Mat',
    description: 'Eco-friendly mat with non-slip surface.',
    price: 34.99,
    stock: 70,
    image_url:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    category: 'Fitness',
  },
  {
    name: 'Desk Organizer',
    description: 'A set of compartments to keep your workspace tidy.',
    price: 29.99,
    stock: 90,
    image_url:
      'https://images.unsplash.com/photo-1644463589256-02679b9c0767?auto=format&fit=crop&w=800&q=80',
    category: 'Office',
  },
  {
    name: 'Travel Pillow',
    description: 'Memory foam pillow with washable cover.',
    price: 27.99,
    stock: 65,
    image_url:
      'https://images.unsplash.com/photo-1747107237201-7047ccfbeac7?auto=format&fit=crop&w=800&q=80',
    category: 'Travel',
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Compact speaker with deep bass and wireless pairing.',
    price: 59.99,
    stock: 45,
    image_url:
      'https://images.unsplash.com/photo-1507878566509-a0dbe19677a5?auto=format&fit=crop&w=1200&q=80',
    category: 'Audio',
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight shoes designed for daily training runs.',
    price: 99.99,
    stock: 50,
    image_url:
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1200&q=80',
    category: 'Fitness',
  },
  {
    name: 'Minimalist Wallet',
    description: 'Slim wallet that holds cards and cash without bulk.',
    price: 22.99,
    stock: 75,
    image_url:
      'https://images.unsplash.com/photo-1689757842488-4bd11717611d?auto=format&fit=crop&w=1200&q=80',
    category: 'Accessories',
  },
];

function seed() {
  console.log('Starting database seeding...');

  // ─── Products Seeding ──────────────────────────────────────────────────────
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
  console.log('Products processed successfully.');

  // ─── Users Seeding ─────────────────────────────────────────────────────────
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
    console.log('Default users created.');
  }

  console.log('Database seeded successfully.');
}

// Execute the seed script
seed();
