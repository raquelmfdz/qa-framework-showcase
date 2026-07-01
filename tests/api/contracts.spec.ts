import { test, expect, request as playwrightRequest } from '@playwright/test';
import {
  createOrdersInDbForUser,
  deleteOrdersFromDb,
  resolveProductIdByName,
} from '../src/helpers/orders-api';
import { SEED_USERS } from '../src/data/users';
import { VALID_CHECKOUT_DETAILS, SEED_PRODUCTS } from '../src/data/products';
import { loginViaApi } from '../src/helpers/auth-api';

test.describe('API Contracts and Guardrails', () => {
  test('GET /api/products returns a JSON array @smoke', async ({ request }) => {
    const res = await request.get('/api/products');
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length, 'Products API must return at least one seeded product').toBeGreaterThan(0);

    const first = body[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('price');
    expect(first).toHaveProperty('category');
  });

  test('GET /api/orders returns empty array for unauthenticated client', async ({ request }) => {
    const res = await request.get('/api/orders');
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toEqual([]);
  });

  test('GET /api/admin/orders denies unauthenticated access @smoke', async ({ request }) => {
    const res = await request.get('/api/admin/orders');
    expect(res.status()).toBe(401);
    await expect(res.text()).resolves.toMatch(/unauthorized/i);
  });

  test('GET /api/orders/:id denies unauthenticated access', async ({ request }) => {
    const res = await request.get('/api/orders/1');
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

  test('GET /api/orders/:id denies cross-user access with 403', async ({ baseURL }) => {
    const createdOrderIds: number[] = [];
    const backpackId = resolveProductIdByName(SEED_PRODUCTS.mountainBackpack.name);

    try {
      const seeded = createOrdersInDbForUser(SEED_USERS.admin.email, [
        {
          lines: [
            {
              productId: backpackId,
              quantity: 1,
              unitPrice: SEED_PRODUCTS.mountainBackpack.price,
            },
          ],
          customerName: VALID_CHECKOUT_DETAILS.firstName,
          customerLastName: VALID_CHECKOUT_DETAILS.lastName,
          customerEmail: VALID_CHECKOUT_DETAILS.email,
          customerZipCode: VALID_CHECKOUT_DETAILS.zipCode,
          shippingAddress: VALID_CHECKOUT_DETAILS.address,
        },
      ]);

      const orderId = seeded[0].id;
      createdOrderIds.push(orderId);

      const userAuth = await playwrightRequest.newContext({ baseURL: baseURL! });
      await loginViaApi(userAuth, baseURL!, {
        email: SEED_USERS.user.email,
        password: SEED_USERS.user.password,
      });

      const res = await userAuth.get(`/api/orders/${orderId}`);
      expect(res.status()).toBe(403);
      await expect(res.text()).resolves.toMatch(/forbidden/i);

      await userAuth.dispose();
    } finally {
      deleteOrdersFromDb(createdOrderIds);
    }
  });
});
