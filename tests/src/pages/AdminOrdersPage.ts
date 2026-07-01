import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Maps to web/app/admin/orders/page.tsx + web/app/api/admin/orders/[id]/route.ts */
export class AdminOrdersPage extends BasePage {
  readonly orderRows: Locator;

  constructor(page: Page) {
    super(page);
    this.orderRows = page.getByTestId('admin-order-row');
  }

  async open(): Promise<void> {
    await this.goto('/admin/orders');
  }

  orderRowById(orderId: string): Locator {
    return this.orderRows.filter({ hasText: `#${orderId}` });
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const row = this.orderRowById(orderId);
    await row.getByRole('combobox', { name: /status/i }).selectOption(status);
  }
}
