import { Page, Locator } from '@playwright/test';

/**
 * Common base for every Page Object. Keep this thin — it should only hold
 * truly cross-cutting helpers (navigation, toasts/alerts, generic waits),
 * not feature-specific logic.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Generic toast/error banner locator. Adjust the selector to match
   * whatever component you use for inline error/success messages
   * (e.g. a shared <Toast/> or an inline <p role="alert">).
   */
  get alertBanner(): Locator {
    return this.page.getByRole('alert');
  }

  async waitForUrl(pattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(pattern);
  }
}
