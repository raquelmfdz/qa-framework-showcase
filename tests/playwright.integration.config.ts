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
  testDir: './e2e',
  globalSetup: './global-setup.ts',
  reporter: [['html', { outputFolder: 'playwright-report/e2e', open: 'never' }], ['list']],
  webServer: {
    command: process.env.CI ? 'npm run start --workspace=web' : 'npm run dev --workspace=web',
    cwd: path.resolve(__dirname, '..'),
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
