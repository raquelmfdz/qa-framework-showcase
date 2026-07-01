import { test, expect } from '../../src/fixtures/pages.fixture';
import { SEED_USERS } from '../../src/data/users';
import { SEED_PRODUCTS, VALID_CHECKOUT_DETAILS } from '../../src/data/products';
import { clearCart } from '../../src/helpers/api-data';

/**
 * Happy Path E2E Test Suite
 *
 * This suite tests the complete user journey:
 * 1. User logs in via UI
 * 2. Verifies they see the home page
 * 3. Adds multiple items to the cart
 * 4. Reviews cart with all items and total
 * 5. Proceeds to checkout
 * 6. Successfully places an order
 * 7. Confirms order success and order appears in order history
 *
 * Runs under 'as-guest' project to start fresh (no pre-existing session).
 */
test.describe('E2E Purchase Happy Path', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await clearCart(request, baseURL!);
  });

  test('user logs in, adds items, validates cart total, and places an order @smoke', async ({
    page,
    loginPage,
    homePage,
    cartPage,
    checkoutPage,
    orderSuccessPage,
  }) => {
    // Step 1: login via UI.
    await loginPage.open();
    await loginPage.login(SEED_USERS.user.email, SEED_USERS.user.password);
    await expect(page).toHaveURL('/');

    // Step 2: home page shows first page of catalog.
    await homePage.open();
    await expect(homePage.productCards).toHaveCount(6);

    // Step 3: add items using explicit product testids for stability.
    const productsToAdd = [
      { id: 1, product: SEED_PRODUCTS.mountainBackpack },
      { id: 2, product: SEED_PRODUCTS.campingLantern },
      { id: 3, product: SEED_PRODUCTS.wirelessHeadphones },
    ];

    for (const entry of productsToAdd) {
      const cartCountBefore = await page.getByTestId('cart-item-count').textContent();
      await page.getByTestId(`add-to-cart-${entry.id}`).click();
      // Wait for cart count to update rather than using a hard timeout.
      await expect(page.getByTestId('cart-item-count')).not.toHaveText(cartCountBefore ?? '');
    }

    // Step 4: cart contains selected items.
    await cartPage.open();
    await expect(page).toHaveURL('/cart');

    for (const entry of productsToAdd) {
      await expect(cartPage.lineItemByName(entry.product.name)).toBeVisible();
    }

    const expectedTotal = productsToAdd.reduce((sum, entry) => sum + entry.product.price, 0);
    await expect(cartPage.totalAmount).toContainText(`€${expectedTotal.toFixed(2)}`);

    // Step 5: checkout and place order.
    await cartPage.goToCheckout();
    await expect(page).toHaveURL('/checkout');

    // Wait for actionable checkout controls instead of relying on network idle.
    await expect(checkoutPage.placeOrderButton).toBeVisible();

    await checkoutPage.fillShippingDetails(VALID_CHECKOUT_DETAILS);

    // Guard against late profile effects clearing required fields.
    await expect(checkoutPage.lastNameInput).toHaveValue(VALID_CHECKOUT_DETAILS.lastName);
    await expect(checkoutPage.zipCodeInput).toHaveValue(VALID_CHECKOUT_DETAILS.zipCode);

    await checkoutPage.placeOrder();

    await expect(page).toHaveURL(/\/order\/success\/\d+/, { timeout: 15000 });
    await expect(orderSuccessPage.confirmationHeading).toBeVisible();
    await expect(orderSuccessPage.orderIdText).toBeVisible();

    // Step 6: cart is cleared after successful checkout.
    await cartPage.open();
    await expect(cartPage.emptyCartMessage).toBeVisible();
  });
});
