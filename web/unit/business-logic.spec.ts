import { describe, it, expect } from 'vitest';
import {
  VALID_ADMIN_ORDER_STATUSES,
  normalizeEmail,
  validateRegistrationInput,
  parseOrderId,
  normalizeOrderStatus,
  isValidAdminOrderStatus,
  validateOrderStatusUpdate,
  isValidZipCode,
  calculateCartTotal,
} from '../lib/business-rules';

/**
 * Unit tests for shared business-rule helpers consumed by API routes.
 * These are intentionally pure and fast: no DB, no browser, no server.
 */

describe('normalizeEmail', () => {
  it('trims and lowercases email input', () => {
    expect(normalizeEmail('  USER@Example.COM  ')).toBe('user@example.com');
  });

  it('lowercases without surrounding whitespace', () => {
    expect(normalizeEmail('Admin@EXAMPLE.com')).toBe('admin@example.com');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeEmail('')).toBe('');
  });
});

describe('validateRegistrationInput', () => {
  it('rejects missing email/password', () => {
    const result = validateRegistrationInput({ email: '', password: '' });
    expect(result).toEqual({ valid: false, message: 'Email and password are required' });
  });

  it('rejects invalid email format', () => {
    const result = validateRegistrationInput({ email: 'bad-email', password: 'Password1!' });
    expect(result).toEqual({ valid: false, message: 'Invalid email address' });
  });

  it('rejects short password', () => {
    const result = validateRegistrationInput({ email: 'user@example.com', password: '123' });
    expect(result).toEqual({ valid: false, message: 'Password must be at least 6 characters' });
  });

  it('accepts valid registration values', () => {
    const result = validateRegistrationInput({ email: 'USER@example.com', password: 'Password1!' });
    expect(result).toEqual({ valid: true });
  });
});

describe('parseOrderId', () => {
  it('parses valid numeric ids', () => {
    expect(parseOrderId('42')).toBe(42);
  });

  it('rejects NaN and zero-ish values', () => {
    expect(parseOrderId('abc')).toBeNull();
    expect(parseOrderId('0')).toBeNull();
  });
});

describe('normalizeOrderStatus', () => {
  it('trims and uppercases status input', () => {
    expect(normalizeOrderStatus('  shipped ')).toBe('SHIPPED');
  });
});

describe('isValidAdminOrderStatus', () => {
  it.each(VALID_ADMIN_ORDER_STATUSES)('accepts valid status "%s"', (status) => {
    expect(isValidAdminOrderStatus(status)).toBe(true);
  });

  it('rejects unsupported status', () => {
    expect(isValidAdminOrderStatus('RETURNED')).toBe(false);
  });
});

describe('validateOrderStatusUpdate', () => {
  it('accepts valid status and returns normalized value', () => {
    const result = validateOrderStatusUpdate({ status: 'processing' });
    expect(result).toEqual({ valid: true, normalizedStatus: 'PROCESSING' });
  });

  it('rejects unknown status with route-compatible message', () => {
    const result = validateOrderStatusUpdate({ status: 'returning' });
    expect(result).toEqual({
      valid: false,
      message: 'Invalid status. Must be one of: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED',
    });
  });
});

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
