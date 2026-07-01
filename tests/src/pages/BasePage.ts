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

  get alertBanner(): Locator {
    return this.page.getByRole('alert');
  }

  async waitForUrl(pattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(pattern);
  }
}
