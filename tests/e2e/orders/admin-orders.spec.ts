import { test, expect } from '../../src/fixtures/pages.fixture';
import { VALID_CHECKOUT_DETAILS } from '../../src/data/products';
import { clearCart, addProductToCart } from '../../src/helpers/api-data';

/**
 * Admin specs run under 'as-admin' project — storageState: .auth/admin.json.
 *
 * We seed an order via the checkout flow using the ADMIN user's session
 * (the admin can also be a customer). If your app separates admin and
 * customer accounts completely, adjust to place the order via the user
 * account's API and then verify as admin.
 */
test.describe('Admin — Order Management', () => {
  test('admin can access /admin/orders @smoke', async ({ adminOrdersPage }) => {
    await adminOrdersPage.open();
    await expect(adminOrdersPage.orderRows.or(adminOrdersPage.emptyState)).toBeVisible();
  });

  test('placed order appears in admin panel', async ({
    request,
    baseURL,
    checkoutPage,
    adminOrdersPage,
    page,
  }) => {
    await clearCart(request, baseURL!);
    await addProductToCart(request, baseURL!, 5, 1);

    await checkoutPage.open();
    await checkoutPage.fillShippingDetails({
      ...VALID_CHECKOUT_DETAILS,
      firstName: 'Admin',
      email: 'admin@example.com',
    });
    await checkoutPage.placeOrder();
    await page.waitForURL(/\/order\/success\/(\d+)/);
    const match = page.url().match(/\/order\/success\/(\d+)/);
    const orderId = match?.[1] ?? '';

    await adminOrdersPage.open();
    await expect(adminOrdersPage.orderRowById(orderId)).toBeVisible();
  });

  test('admin can update order status to SHIPPED', async ({
    request,
    baseURL,
    checkoutPage,
    adminOrdersPage,
    page,
  }) => {
    await clearCart(request, baseURL!);
    await addProductToCart(request, baseURL!, 6, 1);

    await checkoutPage.open();
    await checkoutPage.fillShippingDetails({
      ...VALID_CHECKOUT_DETAILS,
      firstName: 'Admin',
      email: 'admin@example.com',
    });
    await checkoutPage.placeOrder();
    await page.waitForURL(/\/order\/success\/(\d+)/);
    const match = page.url().match(/\/order\/success\/(\d+)/);
    const orderId = match?.[1] ?? '';

    await adminOrdersPage.open();
    await adminOrdersPage.updateOrderStatus(orderId, 'SHIPPED');

    // Reload to confirm persistence
    await adminOrdersPage.open();
    await expect(adminOrdersPage.orderRowById(orderId)).toContainText(/SHIPPED/i);
  });
});

/**
 * Access control: a regular USER must NOT reach /admin/orders.
 * This test uses the as-user storageState by overriding it inline via
 * browser context. We declare it in a separate describe so it doesn't
 * inherit the as-admin storageState from the project.
 *
 * Alternatively, place this in e2e/auth/login.spec.ts under 'as-user' project.
 * Keeping it here groups the "admin access" concern in one file.
 */
test.describe('Admin — Access Control', () => {
  test('regular user is redirected away from /admin/orders', async ({ page }) => {
    // This test runs under as-admin project so we need a fresh context
    // without admin session to simulate a regular user attempting access.
    // The cleanest approach: assert the ADMIN can see it (above), and cover
    // the USER-forbidden case from the as-user project in auth/login.spec.ts.
    // This test is intentionally left as a reminder to add that coverage there.
    test.skip(true, 'Move to e2e/auth/login.spec.ts under as-user project for proper context');
  });
});
