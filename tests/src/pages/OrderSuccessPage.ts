import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Maps to web/app/order/success/[orderId]/page.tsx */
export class OrderSuccessPage extends BasePage {
  readonly confirmationHeading: Locator;
  readonly orderIdText: Locator;

  constructor(page: Page) {
    super(page);
    this.confirmationHeading = page.getByRole('heading', {
      name: /order placed successfully|order confirmed|thank you/i,
    });
    this.orderIdText = page.getByTestId('order-id');
  }

  async expectOrderId(orderId: string): Promise<void> {
    await this.page.waitForURL(new RegExp(`/order/success/${orderId}`));
  }
}
