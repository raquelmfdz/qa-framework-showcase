import { test, expect } from '../../src/fixtures/pages.fixture';
import { SEED_USERS } from '../../src/data/users';
import { VALID_CHECKOUT_DETAILS } from '../../src/data/products';

test.describe('E2E Profile Editing', () => {
  test('user can update profile fields and sees persisted values after reload', async ({
    page,
    profilePage,
  }) => {
    await profilePage.open();
    await expect(page).toHaveURL('/profile');

    const updated = {
      name: `QA-${Date.now()}`,
      lastName: 'Profile',
      zipCode: '12345',
      address: '123 Verification Street',
    };

    const seededProfile = {
      name: SEED_USERS.user.name,
      lastName: SEED_USERS.user.lastName,
      zipCode: VALID_CHECKOUT_DETAILS.zipCode,
      address: VALID_CHECKOUT_DETAILS.address,
    };

    try {
      await profilePage.updateProfile(updated);
      await expect(profilePage.successMessage).toBeVisible();

      await page.reload();
      await expect(profilePage.nameInput).toHaveValue(updated.name);
      await expect(profilePage.lastNameInput).toHaveValue(updated.lastName);
      await expect(profilePage.zipCodeInput).toHaveValue(updated.zipCode);
      await expect(profilePage.addressInput).toHaveValue(updated.address);
    } finally {
      await profilePage.updateProfile(seededProfile);
      await expect(profilePage.successMessage).toBeVisible();
    }
  });
});
