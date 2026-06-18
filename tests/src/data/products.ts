/**
 * Mirrors the products created by web/scripts/seed.ts.
 * Use these constants in specs instead of hardcoding product names/prices,
 * so a seed change only needs updating here.
 */
export const SEED_PRODUCTS = {
  mountainBackpack: { name: 'Mountain Backpack', price: 79.99, category: 'Outdoor' },
  campingLantern: { name: 'Camping Lantern', price: 39.99, category: 'Outdoor' },
  wirelessHeadphones: { name: 'Wireless Headphones', price: 129.99, category: 'Electronics' },
  smartWaterBottle: { name: 'Smart Water Bottle', price: 49.99, category: 'Health' },
  travelJournal: { name: 'Travel Journal', price: 19.99, category: 'Stationery' },
  ceramicCoffeeMug: { name: 'Ceramic Coffee Mug', price: 24.99, category: 'Home' },
  yogaMat: { name: 'Yoga Mat', price: 34.99, category: 'Fitness' },
  deskOrganizer: { name: 'Desk Organizer', price: 29.99, category: 'Office' },
  travelPillow: { name: 'Travel Pillow', price: 27.99, category: 'Travel' },
  portableSpeaker: { name: 'Portable Bluetooth Speaker', price: 59.99, category: 'Audio' },
  runningShoes: { name: 'Running Shoes', price: 99.99, category: 'Fitness' },
  minimalistWallet: { name: 'Minimalist Wallet', price: 22.99, category: 'Accessories' },
} as const;

export type SeedProductKey = keyof typeof SEED_PRODUCTS;

/** Shared valid checkout form data, mirrors seed user "Regular McUserton" */
export const VALID_CHECKOUT_DETAILS = {
  firstName: 'Regular',
  lastName: 'McUserton',
  email: 'user@example.com',
  zipCode: '12345',
  address: '42 Ordinary Street, Normaltown',
};
