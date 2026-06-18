import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { baseConfig, BASE_URL } from './playwright.base.config';

dotenv.config({ path: path.resolve(__dirname, '.env') });

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
  timeout: 10_000,
  workers: process.env.CI ? 4 : undefined,

  reporter: [['html', { outputFolder: 'playwright-report/integration', open: 'never' }], ['list']],

  webServer: {
    command: 'npm run dev --workspace=web',
    url: BASE_URL,
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
