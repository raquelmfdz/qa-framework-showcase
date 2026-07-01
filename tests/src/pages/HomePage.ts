import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Maps to web/app/page.tsx + components/ProductGrid.tsx + ProductCard.tsx */
export class HomePage extends BasePage {
  readonly productCards: Locator;

  constructor(page: Page) {
    super(page);
    this.productCards = page.locator('[data-testid^="product-card-"]');
  }

  async open(): Promise<void> {
    await this.goto('/');
  }

  productCardByName(name: string): Locator {
    return this.productCards.filter({ hasText: name });
  }

  async addToCartByName(name: string): Promise<void> {
    const card = this.productCardByName(name);
    await card.waitFor({ state: 'visible' });
    const button = card
      .locator('[data-testid*="add-to-cart"]')
      .or(card.getByRole('button', { name: /add to cart/i }));
    await button.click();
  }
}
