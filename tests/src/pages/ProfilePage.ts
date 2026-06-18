import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Maps to web/app/profile/page.tsx + web/app/api/profile/route.ts */
export class ProfilePage extends BasePage {
  readonly nameInput: Locator;
  readonly lastNameInput: Locator;
  readonly addressInput: Locator;
  readonly zipCodeInput: Locator;
  readonly saveButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByLabel(/^name|first name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.addressInput = page.getByLabel(/address/i);
    this.zipCodeInput = page.getByLabel(/zip code|postal code/i);
    this.saveButton = page.getByRole('button', { name: /save/i });
    this.successMessage = page.getByText(/profile updated/i);
  }

  async open(): Promise<void> {
    await this.goto('/profile');
  }

  async updateName(name: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.saveButton.click();
  }
}
