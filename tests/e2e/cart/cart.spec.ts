import { test, expect } from '../../src/fixtures/pages.fixture';
import { SEED_PRODUCTS } from '../../src/data/products';
import { clearCart } from '../../src/helpers/api-data';

/**
 * Cart specs run under 'as-user' project — storageState: .auth/user.json.
 * Each test clears the cart via API in beforeEach to guarantee isolation.
 */
test.describe('Cart', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await clearCart(request, baseURL!);
  });

  test('empty cart shows empty state message @smoke', async ({ cartPage }) => {
    await cartPage.open();
    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(cartPage.checkoutButton).not.toBeVisible();
  });

  test('adding a product from catalog appears in cart @smoke', async ({ homePage, cartPage }) => {
    const product = SEED_PRODUCTS.campingLantern;
    await homePage.open();
    await homePage.addToCartByName(product.name);
    await cartPage.open();
    await expect(cartPage.lineItemByName(product.name)).toBeVisible();
  });

  test('cart total reflects product price', async ({ homePage, cartPage }) => {
    await homePage.open();
    await homePage.addToCartByName(SEED_PRODUCTS.travelJournal.name);
    await cartPage.open();
    await expect(cartPage.totalAmount).toContainText(
      `$${SEED_PRODUCTS.travelJournal.price.toFixed(2)}`
    );
  });

  test('removing an item from cart clears it', async ({ homePage, cartPage }) => {
    const product = SEED_PRODUCTS.yogaMat;
    await homePage.open();
    await homePage.addToCartByName(product.name);
    await cartPage.open();
    await cartPage.removeItemByName(product.name);
    await expect(cartPage.emptyCartMessage).toBeVisible();
  });

  test('adding multiple products shows all in cart', async ({ homePage, cartPage }) => {
    const products = [SEED_PRODUCTS.ceramicCoffeeMug, SEED_PRODUCTS.minimalistWallet];
    await homePage.open();
    for (const p of products) {
      await homePage.addToCartByName(p.name);
    }
    await cartPage.open();
    for (const p of products) {
      await expect(cartPage.lineItemByName(p.name)).toBeVisible();
    }
  });

  test('navbar cart badge updates after adding product', async ({ homePage, navbar }) => {
    await homePage.open();
    await homePage.addToCartByName(SEED_PRODUCTS.deskOrganizer.name);
    await expect(navbar.cartItemCount).toContainText('1');
  });
});
