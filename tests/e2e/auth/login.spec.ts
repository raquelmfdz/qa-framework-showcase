import { test, expect } from '../../src/fixtures/pages.fixture';
import { SEED_USERS } from '../../src/data/users';

/**
 * Auth specs run under the 'as-guest' project (no storageState),
 * so the browser starts each test with no session cookie.
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('successful login redirects to home @smoke', async ({ loginPage, page }) => {
    await loginPage.login(SEED_USERS.user.email, SEED_USERS.user.password);
    await expect(page).toHaveURL('/');
  });

  test('displays error on wrong password', async ({ loginPage }) => {
    await loginPage.login(SEED_USERS.user.email, 'WrongPassword!');
    await loginPage.expectLoginError();
  });

  test('displays error on unknown email', async ({ loginPage }) => {
    await loginPage.login('nobody@example.com', SEED_USERS.user.password);
    await loginPage.expectLoginError();
  });

  test('stays on login page after failed attempt', async ({ loginPage, page }) => {
    await loginPage.login('bad@user.com', 'nope');
    await expect(page).toHaveURL('/login');
  });

  test('logout clears session and redirects to login @smoke', async ({ page, navbar }) => {
    // For this test we need to be logged in first — log in via UI
    // (this is the one spec where UI login is explicitly what we are testing)
    const { loginPage: lp } = { loginPage: (await page.goto('/login')) && page };
    await page.getByLabel(/email/i).fill(SEED_USERS.user.email);
    await page.getByLabel(/password/i).fill(SEED_USERS.user.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL('/');

    await navbar.logout();
    await expect(page).toHaveURL(/login|\/$/);

    // After logout, protected routes should redirect back to login
    await page.goto('/orders');
    await expect(page).toHaveURL(/login/);
  });

  test('unauthenticated access to /orders redirects to login', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/login/);
  });

  test('unauthenticated access to /checkout redirects to login', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/login/);
  });

  test('unauthenticated access to /admin/orders redirects to login', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/login/);
  });
});
