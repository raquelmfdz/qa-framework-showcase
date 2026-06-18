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
  readonly profileLink: Locator;
  readonly logoutButton: Locator;
  readonly loginLink: Locator;
  readonly userDisplayName: Locator;

  constructor(private readonly page: Page) {
    this.cartLink = page.getByRole('link', { name: /cart/i });
    this.cartItemCount = page.getByTestId('cart-item-count');
    this.profileLink = page.getByRole('link', { name: /profile/i });
    this.logoutButton = page.getByRole('button', { name: /log out|sign out/i });
    this.loginLink = page.getByRole('link', { name: /log in|sign in/i });
    this.userDisplayName = page.getByTestId('navbar-user-name');
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }
}
