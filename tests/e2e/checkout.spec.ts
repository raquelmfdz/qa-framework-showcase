import { test, expect } from '../src/fixtures/pages.fixture';
import { SEED_PRODUCTS, VALID_CHECKOUT_DETAILS } from '../src/data/products';
import { clearCart, addProductToCart } from '../src/helpers/api-data';

/**
 * Checkout specs run under 'as-user'. They seed cart state via API in
 * beforeEach so each test starts from a deterministic, known state.
 * Product IDs 1-12 correspond to insertion order in seed.ts (Backpack=1,
 * Lantern=2, etc.) — adjust if you add/remove seed products.
 */
test.describe('Checkout', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await clearCart(request, baseURL!);
    // Seed one product (Camping Lantern, id=2) into the cart via API
    await addProductToCart(request, baseURL!, 2, 1);
  });

  test('complete checkout flow places order and shows confirmation @smoke', async ({
    checkoutPage,
    orderSuccessPage,
    page,
  }) => {
    await checkoutPage.open();
    await checkoutPage.fillShippingDetails(VALID_CHECKOUT_DETAILS);
    await checkoutPage.placeOrder();

    // Should redirect to /order/success/[orderId]
    await expect(page).toHaveURL(/\/order\/success\/\d+/);
    await expect(orderSuccessPage.confirmationHeading).toBeVisible();
  });

  test('cart is cleared after successful checkout', async ({ checkoutPage, cartPage, page }) => {
    await checkoutPage.open();
    await checkoutPage.fillShippingDetails(VALID_CHECKOUT_DETAILS);
    await checkoutPage.placeOrder();
    await page.waitForURL(/\/order\/success\//);

    await cartPage.open();
    await expect(cartPage.emptyCartMessage).toBeVisible();
  });

  test('placed order appears in order history', async ({ checkoutPage, ordersPage, page }) => {
    await checkoutPage.open();
    await checkoutPage.fillShippingDetails(VALID_CHECKOUT_DETAILS);
    await checkoutPage.placeOrder();
    await page.waitForURL(/\/order\/success\/(\d+)/);

    // Extract orderId from the URL
    const match = page.url().match(/\/order\/success\/(\d+)/);
    const orderId = match?.[1] ?? '';

    await ordersPage.open();
    await expect(ordersPage.orderRowById(orderId)).toBeVisible();
  });

  test('accessing /checkout with empty cart redirects or shows empty state', async ({
    request,
    baseURL,
    checkoutPage,
    page,
  }) => {
    // Ensure cart is empty for this test
    await clearCart(request, baseURL!);
    await checkoutPage.open();
    // Either redirected away or an empty-cart message is shown
    const isRedirected = !page.url().includes('/checkout');
    const hasEmptyMessage = await page.getByText(/cart is empty|nothing in your cart/i).isVisible();
    expect(isRedirected || hasEmptyMessage).toBeTruthy();
  });
});
