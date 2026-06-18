import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Maps to web/app/checkout/page.tsx + web/app/api/orders/route.ts.
 * Field names follow the `orders` table columns from web/lib/db.ts
 * (customer_name, customer_last_name, customer_zip_code, shipping_address)
 * — adjust getByLabel strings once you confirm the actual <label> text.
 */
export class CheckoutPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly zipCodeInput: Locator;
  readonly addressInput: Locator;
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByLabel(/first name|name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.emailInput = page.getByLabel(/email/i);
    this.zipCodeInput = page.getByLabel(/zip code|postal code/i);
    this.addressInput = page.getByLabel(/address/i);
    this.placeOrderButton = page.getByRole('button', { name: /place order|confirm order/i });
  }

  async open(): Promise<void> {
    await this.goto('/checkout');
  }

  async fillShippingDetails(details: {
    firstName: string;
    lastName: string;
    email: string;
    zipCode: string;
    address: string;
  }): Promise<void> {
    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.emailInput.fill(details.email);
    await this.zipCodeInput.fill(details.zipCode);
    await this.addressInput.fill(details.address);
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }
}
