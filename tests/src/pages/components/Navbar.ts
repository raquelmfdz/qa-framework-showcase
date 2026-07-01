import { Page, Locator } from '@playwright/test';

/**
 * Maps to web/components/Navbar.tsx. This is a "component object" rather
 * than a page — it's composed into Page Objects or used standalone in specs
 * that only care about nav-level behavior (e.g. "logged-in user sees their
 * name", "cart badge updates after adding an item").
 */
export class Navbar {
  readonly userMenuButton: Locator;
  readonly loginLink: Locator;
  readonly myOrdersLink: Locator;
  readonly cartLink: Locator;
  readonly cartItemCount: Locator;
  readonly logoutMenuItem: Locator;

  constructor(private readonly page: Page) {
    this.userMenuButton = page.getByTestId('nav-user-menu');
    this.loginLink = page.getByTestId('nav-login');
    this.myOrdersLink = page.getByTestId('nav-my-orders');
    this.cartLink = page.getByRole('link', { name: /cart/i });
    this.cartItemCount = page.getByTestId('cart-item-count');
    this.logoutMenuItem = page.getByRole('menuitem', { name: /logout|log out|sign out/i });
  }

  async openUserMenu(): Promise<void> {
    await this.userMenuButton.click();
  }

  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.logoutMenuItem.click();
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }
}
