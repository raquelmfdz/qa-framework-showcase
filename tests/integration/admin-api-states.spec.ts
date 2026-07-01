import { test, expect } from '../src/fixtures/pages.fixture';
import { mockSession } from '../src/helpers/mock-session';

test.describe('Admin Orders — mocked API states', () => {
  test('redirects to login before admin orders API is requested', async ({
    page,
    adminOrdersPage,
  }) => {
    await mockSession(page, 'admin');
    let apiWasCalled = false;

    await page.route('**/api/admin/orders**', async (route) => {
      apiWasCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await adminOrdersPage.open();
    await expect(page).toHaveURL(/\/login\?redirect=/);
    const redirectedTarget = new URL(page.url()).searchParams.get('redirect');
    expect(redirectedTarget).toBe('/admin/orders');
    expect(apiWasCalled).toBe(false);
  });

  test('redirects to login even when mocked USER session exists', async ({ page }) => {
    await mockSession(page, 'user');

    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/\/login\?redirect=/);
    const redirectedTarget = new URL(page.url()).searchParams.get('redirect');
    expect(redirectedTarget).toBe('/admin/orders');
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('redirects to login when admin orders API would fail', async ({ page, adminOrdersPage }) => {
    await mockSession(page, 'admin');

    await page.route('**/api/admin/orders**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await adminOrdersPage.open();
    await expect(page).toHaveURL(/\/login\?redirect=/);
    const redirectedTarget = new URL(page.url()).searchParams.get('redirect');
    expect(redirectedTarget).toBe('/admin/orders');
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });
});
