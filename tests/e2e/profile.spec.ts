import { test, expect } from '../src/fixtures/pages.fixture';
import { SEED_USERS } from '../src/data/users';

/**
 * Profile specs run under 'as-user'.
 * Tests update the profile in the DB via UI — the globalSetup DB reset
 * ensures each run starts with the original seed values.
 */
test.describe('Profile', () => {
  test.beforeEach(async ({ profilePage }) => {
    await profilePage.open();
  });

  test('profile page loads with seeded user data @smoke', async ({ profilePage }) => {
    await expect(profilePage.nameInput).toHaveValue(SEED_USERS.user.name);
    await expect(profilePage.lastNameInput).toHaveValue(SEED_USERS.user.lastName);
  });

  test('updating name reflects in the form after save', async ({ profilePage }) => {
    const newName = 'UpdatedName';
    await profilePage.updateName(newName);
    await expect(profilePage.successMessage).toBeVisible();
    await profilePage.open(); // reload to confirm persistence
    await expect(profilePage.nameInput).toHaveValue(newName);
  });

  test('updated name appears in navbar after save', async ({ profilePage, navbar, page }) => {
    const newName = 'NavbarTestName';
    await profilePage.updateName(newName);
    await page.goto('/');
    await expect(navbar.userDisplayName).toContainText(newName);
  });
});
