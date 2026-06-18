import { test, expect } from '../../src/fixtures/pages.fixture';
import { mockSession } from '../../src/helpers/mock-session';
import { VALID_CHECKOUT_DETAILS } from '../../src/data/products';

/**
 * Checkout integration tests: mock the /api/orders POST and /api/cart
 * responses to test UI behaviour across different API outcomes without
 * placing real orders in the DB.
 */
test.describe('Checkout — mocked API states', () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page, 'user');

    // Seed a non-empty cart response so the checkout page renders
    await page.route('**/api/cart', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [{ productId: 1, name: 'Mock Product', price: 29.99, quantity: 1 }],
          total: 29.99,
        }),
      })
    );
  });

  test('shows error message when order API returns 500', async ({ checkoutPage, page }) => {
    await page.route('**/api/orders', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await checkoutPage.open();
    await checkoutPage.fillShippingDetails(VALID_CHECKOUT_DETAILS);
    await checkoutPage.placeOrder();

    await expect(page.getByText(/error|failed|try again/i)).toBeVisible();
    // Should NOT navigate away on failure
    await expect(page).toHaveURL('/checkout');
  });

  test('shows error message when order API returns 400', async ({ checkoutPage, page }) => {
    await page.route('**/api/orders', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid shipping address' }),
      })
    );

    await checkoutPage.open();
    await checkoutPage.fillShippingDetails(VALID_CHECKOUT_DETAILS);
    await checkoutPage.placeOrder();

    await expect(page.getByText(/invalid shipping address|error/i)).toBeVisible();
  });

  test('redirects to success page when order API returns 201', async ({ checkoutPage, page }) => {
    await page.route('**/api/orders', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 999 }),
      })
    );

    await checkoutPage.open();
    await checkoutPage.fillShippingDetails(VALID_CHECKOUT_DETAILS);
    await checkoutPage.placeOrder();

    await expect(page).toHaveURL(/\/order\/success\/999/);
  });
});
