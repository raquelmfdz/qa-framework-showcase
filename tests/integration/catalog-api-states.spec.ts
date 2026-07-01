import { test, expect } from '../src/fixtures/pages.fixture';
import { mockSession } from '../src/helpers/mock-session';

/**
 * Catalog integration tests against the rendered home page.
 * Home is server-rendered from DB queries (not client fetch /api/products),
 * so these checks focus on visible behavior: cards, category filtering,
 * and pagination controls.
 */
test.describe('Catalog — rendered page behavior', () => {
  test('shows catalog cards and pagination controls on home', async ({ page, homePage }) => {
    await mockSession(page, 'guest');

    await homePage.open();

    await expect(homePage.productCards.first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: /pagination/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'All' })).toBeVisible();
  });

  test('applies category query filter and keeps category context in pagination links', async ({
    page,
    homePage,
  }) => {
    await mockSession(page, 'guest');

    await homePage.open();

    const categoryLink = page.locator('a[href*="/?category="]').filter({ hasText: /./ }).first();
    const href = await categoryLink.getAttribute('href');

    await categoryLink.click();
    await expect(page).toHaveURL(/\?category=/);
    await expect(homePage.productCards.first()).toBeVisible();

    if (href?.includes('category=')) {
      const categoryParam = href.split('category=')[1];
      const encodedCategory = categoryParam?.split('&')[0] ?? '';
      await expect(
        page.locator(`nav[aria-label="Pagination"] a[href*="category=${encodedCategory}"]`).first()
      ).toBeVisible();
    }
  });
});
