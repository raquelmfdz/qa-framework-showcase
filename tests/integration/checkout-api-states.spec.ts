import { test, expect } from '../src/fixtures/pages.fixture';
import { mockSession } from '../src/helpers/mock-session';
import { VALID_CHECKOUT_DETAILS } from '../src/data/products';

/**
 * Checkout integration tests: mock the /api/orders POST and /api/cart
 * responses to test UI behaviour across different API outcomes without
 * placing real orders in the DB.
 */
test.describe('Checkout — mocked API states', () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page, 'user');

    await page.route('**/api/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: VALID_CHECKOUT_DETAILS.firstName,
          last_name: VALID_CHECKOUT_DETAILS.lastName,
          zip_code: VALID_CHECKOUT_DETAILS.zipCode,
          address: VALID_CHECKOUT_DETAILS.address,
        }),
      })
    );

    // Seed a non-empty cart response so checkout is actionable.
    await page.route('**/api/cart', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { product_id: 1, name: 'Mock Product', price: 29.99, quantity: 1, image_url: '' },
        ]),
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

    await expect(page.getByTestId('checkout-error')).toContainText(/failed|unable|error|internal/i);
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

    await expect(page.getByTestId('checkout-error')).toContainText(
      /invalid shipping address|error/i
    );
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
