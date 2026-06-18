import { describe, it, expect } from 'vitest';

/**
 * Unit tests for pure business logic in web/lib/ and web/utils/.
 *
 * These run with Vitest directly against the app source — no browser,
 * no server, no DB. Fast feedback on logic that doesn't need a runtime.
 *
 * Add tests here as you extract pure functions from your app code.
 * Examples below cover realistic patterns from this codebase.
 */

// ── Order status ──────────────────────────────────────────────────────────────
// When you have a shared constants/order.ts file, import from there instead.
const VALID_ORDER_STATUSES = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
type OrderStatus = (typeof VALID_ORDER_STATUSES)[number];

function isValidOrderStatus(status: string): status is OrderStatus {
  return (VALID_ORDER_STATUSES as readonly string[]).includes(status);
}

describe('isValidOrderStatus', () => {
  it.each(VALID_ORDER_STATUSES)('accepts valid status "%s"', (status) => {
    expect(isValidOrderStatus(status)).toBe(true);
  });

  it('rejects an unknown status', () => {
    expect(isValidOrderStatus('PROCESSING')).toBe(false);
  });

  it('rejects lowercase (statuses in DB are uppercase)', () => {
    expect(isValidOrderStatus('pending')).toBe(false);
  });
});

// ── Price formatting ──────────────────────────────────────────────────────────
// Mirrors how prices from the DB (REAL) should be displayed in the UI.
function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

describe('formatPrice', () => {
  it('formats an integer correctly', () => {
    expect(formatPrice(79)).toBe('$79.00');
  });

  it('formats a float correctly', () => {
    expect(formatPrice(129.99)).toBe('$129.99');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatPrice(19.999)).toBe('$20.00');
  });
});

// ── Zip code validation ───────────────────────────────────────────────────────
// Matches the zip_code column used in users and orders tables (TEXT, 5 digits).
function isValidZipCode(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

describe('isValidZipCode', () => {
  it('accepts a valid 5-digit zip', () => {
    expect(isValidZipCode('12345')).toBe(true);
  });

  it('rejects a 4-digit zip', () => {
    expect(isValidZipCode('1234')).toBe(false);
  });

  it('rejects a zip with letters', () => {
    expect(isValidZipCode('1234A')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidZipCode('')).toBe(false);
  });

  it('rejects a zip with spaces', () => {
    expect(isValidZipCode('123 5')).toBe(false);
  });
});

// ── Cart total calculation ────────────────────────────────────────────────────
// Mirrors the total computed before posting to /api/orders.
type CartItem = { price: number; quantity: number };

function calculateCartTotal(items: CartItem[]): number {
  return parseFloat(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
}

describe('calculateCartTotal', () => {
  it('returns 0 for an empty cart', () => {
    expect(calculateCartTotal([])).toBe(0);
  });

  it('calculates total for a single item', () => {
    expect(calculateCartTotal([{ price: 39.99, quantity: 1 }])).toBe(39.99);
  });

  it('multiplies price by quantity', () => {
    expect(calculateCartTotal([{ price: 19.99, quantity: 3 }])).toBe(59.97);
  });

  it('sums multiple items correctly', () => {
    const items = [
      { price: 79.99, quantity: 1 },
      { price: 24.99, quantity: 2 },
    ];
    expect(calculateCartTotal(items)).toBe(129.97);
  });

  it('handles floating point without precision errors', () => {
    const items = [
      { price: 0.1, quantity: 1 },
      { price: 0.2, quantity: 1 },
    ];
    expect(calculateCartTotal(items)).toBe(0.3);
  });
});
