import { test, expect } from '../../src/fixtures/pages.fixture';
import { SEED_PRODUCTS } from '../../src/data/products';

/**
 * Catalog specs run under 'as-guest' (no session needed — the product grid
 * is public). They also run as smoke candidates since the catalog is the
 * entry point of the whole app.
 */
test.describe('Product Catalog', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('displays all 12 seeded products @smoke', async ({ homePage }) => {
    const count = await homePage.getVisibleProductCount();
    expect(count).toBe(12);
  });

  test('renders product names from seed', async ({ homePage }) => {
    for (const product of Object.values(SEED_PRODUCTS)) {
      await expect(homePage.productCardByName(product.name)).toBeVisible();
    }
  });

  test('each product card shows a price', async ({ homePage }) => {
    const cards = homePage.productCards;
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).getByText(/\$\d+\.\d{2}/)).toBeVisible();
    }
  });
});
