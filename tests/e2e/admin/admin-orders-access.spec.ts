import { test, expect } from '../../src/fixtures/pages.fixture';

test.describe('Admin E2E — critical access and visibility', () => {
  test('admin can access client orders page', async ({ page, adminOrdersPage }) => {
    await adminOrdersPage.open();
    await expect(page).toHaveURL('/admin/orders');
    await expect(page.getByRole('heading', { name: /client orders/i })).toBeVisible();

    // Depending on seed/runtime state, admin can see either table rows or an empty state.
    const table = page.getByTestId('admin-orders-table');
    const empty = page.getByText(/no orders found/i);
    await expect(table.or(empty)).toBeVisible();
  });
});
