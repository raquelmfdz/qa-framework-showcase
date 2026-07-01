import { test, expect } from '../../src/fixtures/pages.fixture';
import { SEED_USERS } from '../../src/data/users';
import { SEED_PRODUCTS, VALID_CHECKOUT_DETAILS } from '../../src/data/products';
import { clearCart } from '../../src/helpers/api-data';
import { createOrdersInDbForUser, deleteOrdersFromDb } from '../../src/helpers/orders-api';

test.describe('E2E Orders History', () => {
  test('user with existing orders can view order summaries on My Orders page', async ({
    baseURL,
    page,
    ordersPage,
  }) => {
    const createdOrderIds: number[] = [];
    const api = page.request;

    try {
      const createdOrders = createOrdersInDbForUser(SEED_USERS.user.email, [
        {
          lines: [{ productId: 1, quantity: 1, unitPrice: SEED_PRODUCTS.mountainBackpack.price }],
          customerName: VALID_CHECKOUT_DETAILS.firstName,
          customerLastName: VALID_CHECKOUT_DETAILS.lastName,
          customerEmail: VALID_CHECKOUT_DETAILS.email,
          customerZipCode: VALID_CHECKOUT_DETAILS.zipCode,
          shippingAddress: VALID_CHECKOUT_DETAILS.address,
        },
        {
          lines: [
            { productId: 2, quantity: 2, unitPrice: SEED_PRODUCTS.campingLantern.price },
            { productId: 3, quantity: 1, unitPrice: SEED_PRODUCTS.wirelessHeadphones.price },
          ],
          customerName: VALID_CHECKOUT_DETAILS.firstName,
          customerLastName: VALID_CHECKOUT_DETAILS.lastName,
          customerEmail: VALID_CHECKOUT_DETAILS.email,
          customerZipCode: VALID_CHECKOUT_DETAILS.zipCode,
          shippingAddress: VALID_CHECKOUT_DETAILS.address,
        },
      ]);

      createdOrderIds.push(...createdOrders.map((order) => order.id));

      await ordersPage.open();
      await expect(page).toHaveURL('/orders');

      for (const createdOrder of createdOrders) {
        const row = ordersPage.orderRowById(String(createdOrder.id));
        await expect(row).toBeVisible();
        await expect(row).toContainText(`Total: €${createdOrder.expectedTotal.toFixed(2)}`);
      }

      await expect(page.getByText(/Status:\s*PROCESSING|Status:\s*PENDING/i).first()).toBeVisible();
    } finally {
      await clearCart(api, baseURL!);
      deleteOrdersFromDb(createdOrderIds);
    }
  });
});
