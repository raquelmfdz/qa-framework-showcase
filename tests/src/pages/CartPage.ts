import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Maps to web/app/cart/page.tsx + web/app/api/cart/route.ts */
export class CartPage extends BasePage {
  readonly lineItems: Locator;
  readonly checkoutButton: Locator;
  readonly emptyCartMessage: Locator;
  readonly totalAmount: Locator;

  constructor(page: Page) {
    super(page);
    this.lineItems = page.locator('[data-testid^="cart-item-"]');
    this.checkoutButton = page.getByRole('link', { name: /checkout/i });
    this.emptyCartMessage = page.getByText(/your cart is empty/i);
    this.totalAmount = page.getByTestId('cart-total');
  }

  async open(): Promise<void> {
    await this.goto('/cart');
  }

  lineItemByName(name: string): Locator {
    return this.lineItems.filter({ hasText: name });
  }

  async removeItemByName(name: string): Promise<void> {
    await this.lineItemByName(name)
      .getByRole('button', { name: /remove/i })
      .click();
  }

  async setQuantityByName(name: string, quantity: number): Promise<void> {
    const item = this.lineItemByName(name);
    const qtyInput = item.getByRole('spinbutton');
    await qtyInput.fill(String(quantity));
    await qtyInput.blur();
  }

  async goToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
