import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type PageArg = Parameters<typeof AxeBuilder>[0]['page'];

/**
 * Run axe-core against the current page state and fail on critical/serious violations.
 * Moderate and minor violations are reported in the axe output but do not block CI.
 *
 * WCAG target: 2.1 AA (wcag2a + wcag2aa + wcag21aa tags).
 */
export async function checkA11y(page: PageArg): Promise<void> {
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
