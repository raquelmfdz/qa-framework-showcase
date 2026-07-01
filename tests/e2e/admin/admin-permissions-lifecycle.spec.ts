import { test, expect } from '../../src/fixtures/pages.fixture';
import { SEED_USERS } from '../../src/data/users';
import { SEED_PRODUCTS, VALID_CHECKOUT_DETAILS } from '../../src/data/products';
import {
  createOrdersInDbForUser,
  deleteOrdersFromDb,
  resolveProductIdByName,
} from '../../src/helpers/orders-api';

test.describe('E2E Admin Permissions Lifecycle', () => {
  test('admin can update an order status through admin API and see it reflected in UI @smoke', async ({
    page,
    adminOrdersPage,
  }) => {
    const createdOrderIds: number[] = [];
    const backpackId = resolveProductIdByName(SEED_PRODUCTS.mountainBackpack.name);

    try {
      const [createdOrder] = createOrdersInDbForUser(SEED_USERS.user.email, [
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

      createdOrderIds.push(createdOrder.id);

      await adminOrdersPage.open();
      await expect(adminOrdersPage.orderRowById(String(createdOrder.id))).toContainText(
        /PROCESSING/i
      );

      const updateResponse = await page.request.patch(`/api/admin/orders/${createdOrder.id}`, {
        data: { status: 'SHIPPED' },
      });
      expect(updateResponse.ok()).toBeTruthy();

      await page.reload();
      await expect(adminOrdersPage.orderRowById(String(createdOrder.id))).toContainText(/SHIPPED/i);
    } finally {
      deleteOrdersFromDb(createdOrderIds);
    }
  });

  test.describe('non-admin permissions', () => {
    test.use({ storageState: '.auth/user.json' });

    test('regular user cannot access admin page or update order status', async ({ page }) => {
      const createdOrderIds: number[] = [];
      const lanternId = resolveProductIdByName(SEED_PRODUCTS.campingLantern.name);

      try {
        const [createdOrder] = createOrdersInDbForUser(SEED_USERS.user.email, [
          {
            lines: [
              {
                productId: lanternId,
                quantity: 1,
                unitPrice: SEED_PRODUCTS.campingLantern.price,
              },
            ],
            customerName: VALID_CHECKOUT_DETAILS.firstName,
            customerLastName: VALID_CHECKOUT_DETAILS.lastName,
            customerEmail: VALID_CHECKOUT_DETAILS.email,
            customerZipCode: VALID_CHECKOUT_DETAILS.zipCode,
            shippingAddress: VALID_CHECKOUT_DETAILS.address,
          },
        ]);

        createdOrderIds.push(createdOrder.id);

        await page.goto('/admin/orders');
        await expect(page).toHaveURL('/orders');

        const response = await page.request.patch(`/api/admin/orders/${createdOrder.id}`, {
          data: { status: 'DELIVERED' },
        });

        expect(response.status()).toBe(403);
      } finally {
        deleteOrdersFromDb(createdOrderIds);
      }
    });
  });
});
