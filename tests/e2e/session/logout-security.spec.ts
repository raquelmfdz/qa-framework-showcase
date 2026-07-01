import { test, expect } from '../../src/fixtures/pages.fixture';
import { SEED_USERS } from '../../src/data/users';

test.describe('E2E Session Security', () => {
  test('logged-in user can logout and is redirected when accessing protected profile @smoke', async ({
    page,
    navbar,
    loginPage,
  }) => {
    await page.goto('/');

    await expect(navbar.userMenuButton).toBeVisible();
    await navbar.logout();

    await expect(page).toHaveURL('/login');
    await expect(navbar.loginLink).toBeVisible();

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login\?redirect=/);
    const redirectedTarget = new URL(page.url()).searchParams.get('redirect');
    expect(redirectedTarget).toBe('/profile');
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();

    await loginPage.login(SEED_USERS.user.email, SEED_USERS.user.password);
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('heading', { name: /edit profile/i })).toBeVisible();
  });
});
