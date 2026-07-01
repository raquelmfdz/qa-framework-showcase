import path from 'path';
import Database from 'better-sqlite3';
import { APIRequestContext, expect } from '@playwright/test';
import { addProductToCart, clearCart } from './api-data';

export type ApiOrderLine = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

export type ApiOrderSeed = {
  lines: ApiOrderLine[];
  customerName: string;
  customerLastName: string;
  customerEmail: string;
  customerZipCode: string;
  shippingAddress: string;
};

export type CreatedOrder = {
  id: number;
  expectedTotal: number;
};

export async function createOrdersViaApi(
  request: APIRequestContext,
  baseURL: string,
  seeds: ApiOrderSeed[]
): Promise<CreatedOrder[]> {
  const created: CreatedOrder[] = [];

  for (const seed of seeds) {
    await clearCart(request, baseURL);

    for (const line of seed.lines) {
      await addProductToCart(request, baseURL, line.productId, line.quantity);
    }

    const response = await request.post(`${baseURL}/api/orders`, {
      data: {
        customerName: seed.customerName,
        customerLastName: seed.customerLastName,
        customerEmail: seed.customerEmail,
        customerZipCode: seed.customerZipCode,
        shippingAddress: seed.shippingAddress,
      },
    });

    expect(response.ok(), `Order seed failed: ${response.status()} ${await response.text()}`).toBe(
      true
    );

    const payload = (await response.json()) as { id: number | string };
    const id = Number(payload.id);
    expect(Number.isFinite(id) && id > 0, 'Order API did not return a valid ID').toBe(true);

    const expectedTotal = seed.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    created.push({ id, expectedTotal });
  }

  return created;
}

export function deleteOrdersFromDb(orderIds: number[]): void {
  if (orderIds.length === 0) return;

  const dbFile = path.resolve(process.cwd(), '../web/dev.db');
  const db = new Database(dbFile);

  try {
    const deleteItems = db.prepare('DELETE FROM order_items WHERE order_id = ?');
    const deleteOrder = db.prepare('DELETE FROM orders WHERE id = ?');

    for (const orderId of orderIds) {
      deleteItems.run(orderId);
      deleteOrder.run(orderId);
    }
  } finally {
    db.close();
  }
}

export function createOrdersInDbForUser(userEmail: string, seeds: ApiOrderSeed[]): CreatedOrder[] {
  if (seeds.length === 0) return [];

  const dbFile = path.resolve(process.cwd(), '../web/dev.db');
  const db = new Database(dbFile);

  try {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(userEmail) as
      | { id: number }
      | undefined;

    expect(!!user, `User not found while seeding orders: ${userEmail}`).toBe(true);

    const insertOrder = db.prepare(
      'INSERT INTO orders (user_id, customer_name, customer_last_name, customer_email, customer_zip_code, shipping_address, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
    );

    const created: CreatedOrder[] = [];

    for (const seed of seeds) {
      const expectedTotal = seed.lines.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0
      );

      const orderResult = insertOrder.run(
        user!.id,
        seed.customerName,
        seed.customerLastName,
        seed.customerEmail,
        seed.customerZipCode,
        seed.shippingAddress,
        expectedTotal,
        'PROCESSING'
      ) as { lastInsertRowid: number | bigint };

      const orderId = Number(orderResult.lastInsertRowid);
      expect(
        Number.isFinite(orderId) && orderId > 0,
        'DB seed did not return a valid order ID'
      ).toBe(true);

      for (const line of seed.lines) {
        insertItem.run(orderId, line.productId, line.quantity, line.unitPrice);
      }

      created.push({ id: orderId, expectedTotal });
    }

    return created;
  } finally {
    db.close();
  }
}
