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

  constructor(page: Page) {
    super(page);
    // Match product-card-{id} using CSS selector with attribute prefix match
    this.productCards = page.locator('[data-testid^="product-card-"]');
  }

  async open(): Promise<void> {
    await this.goto('/');
  }

  productCardByName(name: string): Locator {
    return this.productCards.filter({ hasText: name });
  }

  async addToCartByName(name: string): Promise<void> {
    // Find the product card by name, then find the add-to-cart button within it
    const card = this.productCardByName(name);
    // Wait for card to be visible first
    await card.waitFor({ state: 'visible' });
    // Use data-testid to find the button if it exists, otherwise use role
    const button = card
      .locator('[data-testid*="add-to-cart"]')
      .or(card.getByRole('button', { name: /add to cart/i }));
    await button.click();
  }
}
