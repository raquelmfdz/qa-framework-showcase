import { test, expect } from '@playwright/test';

test.describe('API Contracts and Guardrails', () => {
  test('GET /api/products returns a JSON array', async ({ request }) => {
    const res = await request.get('/api/products');
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();

    if (body.length > 0) {
      const first = body[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('price');
      expect(first).toHaveProperty('category');
    }
  });

  test('GET /api/orders returns empty array for unauthenticated client', async ({ request }) => {
    const res = await request.get('/api/orders');
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toEqual([]);
  });

  test('GET /api/admin/orders denies unauthenticated access', async ({ request }) => {
    const res = await request.get('/api/admin/orders');
    expect(res.status()).toBe(401);
    await expect(res.text()).resolves.toMatch(/unauthorized/i);
  });

  test('POST /api/cart rejects invalid payload', async ({ request }) => {
    const res = await request.post('/api/cart', {
      data: { productId: 0, quantity: 0 },
    });

    expect(res.status()).toBe(400);
    await expect(res.text()).resolves.toMatch(/invalid request body/i);
  });

  test('POST /api/orders enforces required checkout fields', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        customerName: '',
        customerLastName: '',
        customerEmail: '',
        customerZipCode: '',
        shippingAddress: '',
      },
    });

    expect(res.status()).toBe(400);
    await expect(res.text()).resolves.toMatch(/all fields are required/i);
  });
});
