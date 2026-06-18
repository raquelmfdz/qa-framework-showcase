import { test, expect } from '../src/fixtures/pages.fixture';
import { mockSession } from '../src/helpers/mock-session';

/**
 * Catalog integration tests: exercise the ProductGrid UI against mocked
 * API responses that would be hard/slow to reproduce with a real DB.
 */
test.describe('Catalog — mocked API states', () => {
  test('shows error state when /api/products returns 500', async ({ page, homePage }) => {
    await mockSession(page, 'guest');
    await page.route('**/api/products', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await homePage.open();

    // Expect some error feedback — adjust text to match your actual error UI
    await expect(page.getByText(/something went wrong|failed to load|error/i)).toBeVisible();
  });

  test('shows empty state when /api/products returns empty array', async ({ page, homePage }) => {
    await mockSession(page, 'guest');
    await page.route('**/api/products', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await homePage.open();

    await expect(homePage.productCards).toHaveCount(0);
    await expect(page.getByText(/no products|nothing here/i)).toBeVisible();
  });

  test('renders only the products returned by the API', async ({ page, homePage }) => {
    await mockSession(page, 'guest');
    const mockProducts = [
      {
        id: 1,
        name: 'Mock Backpack',
        price: 49.99,
        description: 'Test',
        stock: 10,
        image_url: '',
        category: 'Outdoor',
      },
    ];

    await page.route('**/api/products', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProducts),
      })
    );

    await homePage.open();
    await expect(homePage.productCards).toHaveCount(1);
    await expect(homePage.productCardByName('Mock Backpack')).toBeVisible();
  });
});
