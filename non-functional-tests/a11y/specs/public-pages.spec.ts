import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Axe accessibility checks for public pages (no auth required).
 *
 * Impact levels enforced:
 *  - critical and serious → test fails
 *  - moderate and minor   → reported as warnings, do not fail
 *
 * WCAG target: 2.1 AA (axe default ruleset covers this).
 */

async function checkA11y(page: Parameters<typeof AxeBuilder>[0]['page']) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  if (blocking.length > 0) {
    const summary = blocking
      .map(
        (v) => `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`
      )
      .join('\n');
    expect(blocking, `Blocking a11y violations found:\n${summary}`).toHaveLength(0);
  }
}

test.describe('A11y — Public pages', () => {
  test('home / catalog page has no critical or serious violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('login page has no critical or serious violations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('cart page has no critical or serious violations', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('checkout page has no critical or serious violations', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });
});
