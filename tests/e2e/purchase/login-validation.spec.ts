import { test } from '../../src/fixtures/pages.fixture';
import { SEED_USERS } from '../../src/data/users';

test.describe('E2E Login Validation', () => {
  test('shows an announced error for invalid credentials @smoke', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(SEED_USERS.user.email, 'wrong-password');
    await loginPage.expectLoginError();
  });
});
