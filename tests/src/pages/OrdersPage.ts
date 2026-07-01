import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Maps to web/app/orders/page.tsx + web/app/api/orders/[id]/route.ts */
export class OrdersPage extends BasePage {
  readonly orderRows: Locator;
  readonly noOrdersMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.orderRows = page.getByTestId('order-row');
    this.noOrdersMessage = page.getByText(/no orders yet|haven't placed any orders/i);
  }

  async open(): Promise<void> {
    await this.goto('/orders');
  }

  orderRowById(orderId: string): Locator {
    return this.orderRows.filter({ hasText: new RegExp(`Order\\s+#${orderId}\\b`) });
  }
}
