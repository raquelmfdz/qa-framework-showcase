import { test, expect } from '../../src/fixtures/pages.fixture';
import { SEED_USERS } from '../../src/data/users';
import { SEED_PRODUCTS, VALID_CHECKOUT_DETAILS } from '../../src/data/products';
import { clearCart } from '../../src/helpers/api-data';
import { createOrdersInDbForUser, deleteOrdersFromDb } from '../../src/helpers/orders-api';

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
test.describe('Happy Path: Complete User Journey', () => {
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
      await page.getByTestId(`add-to-cart-${entry.id}`).click();
      await page.waitForTimeout(300);
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

    // Allow profile/cart hydration effects to finish before writing form values.
    await page.waitForLoadState('networkidle');

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

  test.describe('Existing Orders (API auth)', () => {
    // Uses setup project storageState generated through loginViaApi.
    test.use({ storageState: '.auth/user.json' });

    test('user with existing orders can view order details on My Orders page', async ({
      baseURL,
      page,
      ordersPage,
    }) => {
      const createdOrderIds: number[] = [];
      const api = page.request;

      try {
        // 1) Seed prior orders directly in DB, linked to the authenticated user.
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

        // 2) Verify user can inspect order details on My Orders page.
        await ordersPage.open();
        await expect(page).toHaveURL('/orders');

        for (const createdOrder of createdOrders) {
          await expect(page.getByText(`Order #${createdOrder.id}`)).toBeVisible();
          await expect(
            page.getByText(`Total: €${createdOrder.expectedTotal.toFixed(2)}`)
          ).toBeVisible();
        }

        await expect(
          page.getByText(/Status:\s*PROCESSING|Status:\s*PENDING/i).first()
        ).toBeVisible();
      } finally {
        // Keep this scenario isolated from all other tests in the run.
        await clearCart(api, baseURL!);
        deleteOrdersFromDb(createdOrderIds);
      }
    });
  });

  test.describe('Access Control (API auth)', () => {
    test.use({ storageState: '.auth/user.json' });

    test('regular user cannot access admin orders page', async ({ page }) => {
      await page.goto('/admin/orders');

      await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible();
      await expect(
        page.getByText(/need an administrator account|administrator account/i)
      ).toBeVisible();
    });
  });
});
