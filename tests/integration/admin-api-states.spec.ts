import { test, expect } from '../src/fixtures/pages.fixture';
import { mockSession } from '../src/helpers/mock-session';

test.describe('Admin Orders — mocked API states', () => {
  test('shows orders list when API returns data', async ({ page, adminOrdersPage }) => {
    await mockSession(page, 'admin');

    await page.route('**/api/admin/orders**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            customer_name: 'Regular',
            customer_last_name: 'User',
            customer_email: 'user@example.com',
            total: 79.99,
            status: 'PENDING',
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            customer_name: 'Other',
            customer_last_name: 'Buyer',
            customer_email: 'other@example.com',
            total: 129.99,
            status: 'SHIPPED',
            created_at: new Date().toISOString(),
          },
        ]),
      })
    );

    await adminOrdersPage.open();
    await expect(adminOrdersPage.orderRowById('1')).toBeVisible();
    await expect(adminOrdersPage.orderRowById('2')).toBeVisible();
  });

  test('shows empty state when no orders exist', async ({ page, adminOrdersPage }) => {
    await mockSession(page, 'admin');

    await page.route('**/api/admin/orders**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );

    await adminOrdersPage.open();
    await expect(page.getByText(/no orders|empty/i)).toBeVisible();
  });

  test('USER role is denied access to admin panel', async ({ page }) => {
    await mockSession(page, 'user');

    // The admin route should return 403 for non-admin users
    await page.route('**/api/admin/**', (route) =>
      route.fulfill({ status: 403, body: 'Forbidden' })
    );

    await page.goto('/admin/orders');

    // Either redirected away or an access-denied message is shown
    const isRedirected = !page.url().includes('/admin');
    const hasForbiddenMsg = await page
      .getByText(/forbidden|not authorized|access denied/i)
      .isVisible();
    expect(isRedirected || hasForbiddenMsg).toBeTruthy();
  });

  test('shows error when admin orders API returns 500', async ({ page, adminOrdersPage }) => {
    await mockSession(page, 'admin');

    await page.route('**/api/admin/orders**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await adminOrdersPage.open();
    await expect(page.getByText(/unable to load orders/i)).toBeVisible();
  });
});
