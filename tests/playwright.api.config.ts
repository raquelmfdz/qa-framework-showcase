import { defineConfig } from '@playwright/test';
import path from 'path';
import { baseConfig, BASE_URL } from './playwright.base.config';

/**
 * API config: request-level tests for route contracts and guardrails.
 * No browser storage/auth setup is required for these unauthenticated
 * and validation-focused endpoint checks.
 */
export default defineConfig({
  ...baseConfig,
  testDir: './api',
  reporter: [
    ['html', { outputFolder: 'playwright-report/api', open: 'never' }],
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
      name: 'api-contracts',
      use: {},
    },
  ],
});
