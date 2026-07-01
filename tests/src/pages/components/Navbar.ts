import { Page, Locator } from '@playwright/test';

/**
 * Maps to web/components/Navbar.tsx. This is a "component object" rather
 * than a page — it's composed into Page Objects or used standalone in specs
 * that only care about nav-level behavior (e.g. "logged-in user sees their
 * name", "cart badge updates after adding an item").
 */
export class Navbar {
  readonly cartLink: Locator;
  readonly cartItemCount: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.cartLink = page.getByRole('link', { name: /cart/i });
    this.cartItemCount = page.getByTestId('cart-item-count');
    this.logoutButton = page.getByRole('button', { name: /log out|sign out/i });
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }
}
