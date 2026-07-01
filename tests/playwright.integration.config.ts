import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { baseConfig, BASE_URL } from './playwright.base.config';

/**
 * Integration config: tests mock the network layer via page.route().
 *
 * Key differences vs playwright.config.ts (e2e):
 *  - No setup project for auth: mocked tests don't need a real NextAuth session.
 *    Instead they mock the /api/auth/session response directly.
 *  - No globalSetup (no DB reset): since API responses are mocked, no real
 *    DB state is read or written — tests are inherently hermetic.
 *  - More workers: no DB contention risk, so we can push parallelism higher.
 *  - Shorter timeout: network is mocked (instant), so 10s is more than enough.
 *
 * Run with: npm run test:integration
 */
export default defineConfig({
  ...baseConfig,
  testDir: './integration',
  reporter: [
    ['html', { outputFolder: 'playwright-report/integration', open: 'never' }],
    ['list'],
    ...(process.env.PW_JSON_REPORT_FILE
      ? [['json', { outputFile: process.env.PW_JSON_REPORT_FILE }] as const]
      : []),
  ],
  webServer: {
    command: process.env.CI
      ? 'npm run seed --workspace=web && npm run start --workspace=web'
      : 'npm run dev --workspace=web',
    cwd: path.resolve(__dirname, '..'),
    url: BASE_URL,
    env: {
      ...process.env,
      NEXTAUTH_URL: BASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'playwright-local-secret',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  projects: [
    {
      name: 'integration-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
