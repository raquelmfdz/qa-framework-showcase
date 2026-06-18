import { test, expect } from '../../src/fixtures/pages.fixture';
import { mockSession } from '../../src/helpers/mock-session';

test.describe('Order History — mocked API states', () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page, 'user');
  });

  test('shows no-orders message when API returns empty array', async ({ page, ordersPage }) => {
    await page.route('**/api/orders', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await ordersPage.open();
    await expect(ordersPage.noOrdersMessage).toBeVisible();
  });

  test('renders order list from API response', async ({ page, ordersPage }) => {
    await page.route('**/api/orders', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 10, total: 59.99, status: 'PENDING', created_at: new Date().toISOString() },
          { id: 11, total: 129.99, status: 'SHIPPED', created_at: new Date().toISOString() },
        ]),
      })
    );

    await ordersPage.open();
    await expect(ordersPage.orderRowById('10')).toBeVisible();
    await expect(ordersPage.orderRowById('11')).toBeVisible();
  });

  test('shows error state when orders API returns 500', async ({ page, ordersPage }) => {
    await page.route('**/api/orders', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await ordersPage.open();
    await expect(page.getByText(/error|failed to load|something went wrong/i)).toBeVisible();
  });

  test('shows PENDING status badge for pending orders', async ({ page, ordersPage }) => {
    await page.route('**/api/orders', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 20, total: 39.99, status: 'PENDING', created_at: new Date().toISOString() },
        ]),
      })
    );

    await ordersPage.open();
    await expect(ordersPage.orderRowById('20')).toContainText(/PENDING/i);
  });
});
