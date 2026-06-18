import { test, expect } from '../../src/fixtures/pages.fixture';
import { VALID_CHECKOUT_DETAILS } from '../../src/data/products';
import { clearCart, addProductToCart } from '../../src/helpers/api-data';

/**
 * Orders specs run under 'as-user'.
 * We don't assume any pre-existing orders (globalSetup resets DB),
 * so we place orders via the checkout flow when needed.
 */
test.describe('Order History', () => {
  test('shows empty state when user has no orders @smoke', async ({ ordersPage }) => {
    await ordersPage.open();
    await expect(ordersPage.noOrdersMessage).toBeVisible();
  });

  test('shows placed order in history', async ({
    request,
    baseURL,
    checkoutPage,
    ordersPage,
    page,
  }) => {
    await clearCart(request, baseURL!);
    await addProductToCart(request, baseURL!, 1, 1);

    await checkoutPage.open();
    await checkoutPage.fillShippingDetails(VALID_CHECKOUT_DETAILS);
    await checkoutPage.placeOrder();
    await page.waitForURL(/\/order\/success\/(\d+)/);

    const match = page.url().match(/\/order\/success\/(\d+)/);
    const orderId = match?.[1] ?? '';

    await ordersPage.open();
    await expect(ordersPage.noOrdersMessage).not.toBeVisible();
    await expect(ordersPage.orderRowById(orderId)).toBeVisible();
  });

  test('order row shows PENDING status after placement', async ({
    request,
    baseURL,
    checkoutPage,
    ordersPage,
    page,
  }) => {
    await clearCart(request, baseURL!);
    await addProductToCart(request, baseURL!, 3, 1);

    await checkoutPage.open();
    await checkoutPage.fillShippingDetails(VALID_CHECKOUT_DETAILS);
    await checkoutPage.placeOrder();
    await page.waitForURL(/\/order\/success\/(\d+)/);

    const match = page.url().match(/\/order\/success\/(\d+)/);
    const orderId = match?.[1] ?? '';

    await ordersPage.open();
    await expect(ordersPage.orderRowById(orderId)).toContainText(/PENDING/i);
  });
});
