import { test, expect } from '../../src/fixtures/pages.fixture';

test.describe('E2E Session Security', () => {
  test('logged-in user can logout and is redirected when accessing protected profile', async ({
    page,
    navbar,
  }) => {
    await page.goto('/');

    await expect(navbar.userMenuButton).toBeVisible();
    await navbar.logout();

    await expect(page).toHaveURL('/login');
    await expect(navbar.loginLink).toBeVisible();

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?redirect=\/profile/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });
});
