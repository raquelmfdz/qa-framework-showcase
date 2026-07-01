export const VALID_ADMIN_ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type AdminOrderStatus = (typeof VALID_ADMIN_ORDER_STATUSES)[number];

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRegistrationInput(input: {
  email: string;
  password: string;
}): { valid: true } | { valid: false; message: string } {
  const email = normalizeEmail(input.email ?? '');
  const password = String(input.password ?? '').trim();

  if (!email || !password) {
    return { valid: false, message: 'Email and password are required' };
  }

  if (!isValidEmail(email)) {
    return { valid: false, message: 'Invalid email address' };
  }

  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }

  return { valid: true };
}

export function parseOrderId(value: string): number | null {
  const id = Number(value);
  if (!id || Number.isNaN(id)) {
    return null;
  }
  return id;
}

export function normalizeOrderStatus(input: string): string {
  return String(input ?? '')
    .trim()
    .toUpperCase();
}

export function isValidAdminOrderStatus(status: string): status is AdminOrderStatus {
  return (VALID_ADMIN_ORDER_STATUSES as readonly string[]).includes(status);
}

export function validateOrderStatusUpdate(input: {
  status: string;
}): { valid: true; normalizedStatus: AdminOrderStatus } | { valid: false; message: string } {
  const normalizedStatus = normalizeOrderStatus(input.status);

  if (!normalizedStatus || !isValidAdminOrderStatus(normalizedStatus)) {
    return {
      valid: false,
      message: `Invalid status. Must be one of: ${VALID_ADMIN_ORDER_STATUSES.join(', ')}`,
    };
  }

  return { valid: true, normalizedStatus };
}

export function isValidZipCode(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export type CartItem = { price: number; quantity: number };

export function calculateCartTotal(items: CartItem[]): number {
  return Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
}
