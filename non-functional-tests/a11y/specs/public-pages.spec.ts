import { test } from '@playwright/test';
import { checkA11y } from '../utils/axe';

/**
 * Axe accessibility checks for public pages (no auth required).
 *
 * Impact levels enforced:
 *  - critical and serious → test fails
 *  - moderate and minor   → reported as warnings, do not fail
 *
 * WCAG target: 2.1 AA (axe default ruleset covers this).
 */

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
