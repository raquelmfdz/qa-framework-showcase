import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database(process.env.DATABASE_FILE || './dev.db');

const sql = db.prepare('SELECT COUNT(*) AS count FROM products');
const productCount = (sql.get() as { count: number }).count;

if (productCount === 0) {
  const products = [
    {
      name: 'Mountain Backpack',
      description: 'A rugged pack for day hikes and overnight excursions.',
      price: 79.99,
      stock: 40,
      image_url:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
      category: 'Outdoor',
    },
    {
      name: 'Camping Lantern',
      description: 'Compact LED lantern with long runtime and adjustable brightness.',
      price: 39.99,
      stock: 60,
      image_url:
        'https://images.unsplash.com/photo-1529516546348-027d0d5d0d44?auto=format&fit=crop&w=800&q=80',
      category: 'Outdoor',
    },
    {
      name: 'Wireless Headphones',
      description: 'Noise-isolating headphones with 24-hour battery life.',
      price: 129.99,
      stock: 35,
      image_url:
        'https://images.unsplash.com/photo-1518441902115-5b1bc515052b?auto=format&fit=crop&w=800&q=80',
      category: 'Electronics',
    },
    {
      name: 'Smart Water Bottle',
      description: 'Keeps drinks cold and tracks hydration with a smart cap.',
      price: 49.99,
      stock: 80,
      image_url:
        'https://images.unsplash.com/photo-1510626176961-4bff9b2f5c37?auto=format&fit=crop&w=800&q=80',
      category: 'Health',
    },
    {
      name: 'Travel Journal',
      description: 'Hardcover journal with numbered pages and world map.',
      price: 19.99,
      stock: 100,
      image_url:
        'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80',
      category: 'Stationery',
    },
    {
      name: 'Ceramic Coffee Mug',
      description: 'Stylish 14oz mug with insulated handle.',
      price: 24.99,
      stock: 55,
      image_url:
        'https://images.unsplash.com/photo-1504880167768-2d38f8f3a2b6?auto=format&fit=crop&w=800&q=80',
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
        'https://images.unsplash.com/photo-1517059224940-d4af9eec41e9?auto=format&fit=crop&w=800&q=80',
      category: 'Office',
    },
    {
      name: 'Travel Pillow',
      description: 'Memory foam pillow with washable cover.',
      price: 27.99,
      stock: 65,
      image_url:
        'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=800&q=80',
      category: 'Travel',
    },
  ];

  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, price, stock, image_url, category) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const product of products) {
    insertProduct.run(
      product.name,
      product.description,
      product.price,
      product.stock,
      product.image_url,
      product.category
    );
  }
  console.log('Seeded products:', products.length);
} else {
  console.log('Products already seeded:', productCount);
}

const userCount = (db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number })
  .count;
if (userCount === 0) {
  const passwordHash = bcrypt.hashSync('Password1!', 10);
  db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(
    'admin@example.com',
    passwordHash,
    'admin'
  );
  db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(
    'user@example.com',
    passwordHash,
    'USER'
  );
  console.log('Seeded default users: admin@example.com, user@example.com');
} else {
  console.log('Users already seeded:', userCount);
}
