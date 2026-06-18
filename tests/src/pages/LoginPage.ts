import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * NOTE ON SELECTORS:
 * I haven't seen web/app/login/page.tsx, so these locators are written
 * against sane Next.js form conventions (label associations + a submit
 * button with accessible text). If your inputs don't have proper
 * <label htmlFor> wiring, swap getByLabel for data-testid locators —
 * e.g. add data-testid="login-email" to the <input> and use
 * page.getByTestId('login-email') instead. Prefer that long-term: testid
 * locators don't break when copy changes.
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /sign in|log in|login/i });
  }

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginError(): Promise<void> {
    await expect(this.alertBanner).toBeVisible();
  }
}
