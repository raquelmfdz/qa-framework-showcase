import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Maps to web/app/page.tsx + components/ProductGrid.tsx + ProductCard.tsx.
 * Selectors assume each card exposes a data-testid="product-card" and an
 * "Add to cart" button inside it — verify against ProductCard.tsx and adjust
 * if the real markup differs (e.g. if it's a Link wrapping the whole card).
 */
export class HomePage extends BasePage {
  readonly productCards: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.productCards = page.getByTestId('product-card');
    this.searchInput = page.getByPlaceholder(/search/i);
  }

  async open(): Promise<void> {
    await this.goto('/');
  }

  productCardByName(name: string): Locator {
    return this.productCards.filter({ hasText: name });
  }

  async addToCartByName(name: string): Promise<void> {
    const card = this.productCardByName(name);
    await card.getByRole('button', { name: /add to cart/i }).click();
  }

  async getVisibleProductCount(): Promise<number> {
    return this.productCards.count();
  }
}
