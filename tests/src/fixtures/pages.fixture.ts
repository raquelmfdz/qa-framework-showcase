import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderSuccessPage } from '../pages/OrderSuccessPage';
import { OrdersPage } from '../pages/OrdersPage';
import { AdminOrdersPage } from '../pages/AdminOrdersPage';
import { ProfilePage } from '../pages/ProfilePage';
import { Navbar } from '../pages/components/Navbar';

/**
 * Page Object fixtures — available to every test importing from this file,
 * regardless of which storageState (if any) the project applies.
 * Each is instantiated lazily per-test via Playwright's fixture system,
 * so there's no shared mutable state between tests.
 */
type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  orderSuccessPage: OrderSuccessPage;
  ordersPage: OrdersPage;
  adminOrdersPage: AdminOrdersPage;
  profilePage: ProfilePage;
  navbar: Navbar;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  orderSuccessPage: async ({ page }, use) => use(new OrderSuccessPage(page)),
  ordersPage: async ({ page }, use) => use(new OrdersPage(page)),
  adminOrdersPage: async ({ page }, use) => use(new AdminOrdersPage(page)),
  profilePage: async ({ page }, use) => use(new ProfilePage(page)),
  navbar: async ({ page }, use) => use(new Navbar(page)),
});

export { expect } from '@playwright/test';
