import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { baseConfig, BASE_URL } from './playwright.base.config';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * E2E config: tests hit a REAL backend (real DB, real NextAuth session).
 *
 * Projects:
 *  - setup      : runs e2e/setup/auth.setup.ts once, generates .auth/admin.json & .auth/user.json
 *  - as-user    : all tests under e2e/ except setup/, purchase/, and admin/, with USER session
 *  - as-admin   : tests under e2e/admin/, with admin session
 *  - as-fresh-login : tests under e2e/purchase/ (no preloaded session)
 *
 * webServer behaviour:
 *  - CI  (process.env.CI=true)  : Playwright boots Next.js and waits for it.
 *  - Local (no CI var)          : reuses whatever is already on port 3000 (your npm run dev).
 *    If nothing is running it will also boot it, so you never need to remember to start it.
 */
export default defineConfig({
  ...baseConfig,
  testDir: './e2e',
  reporter: [['html', { outputFolder: 'playwright-report/e2e', open: 'never' }], ['list']],
  webServer: {
    command: process.env.CI
      ? 'npm run db:reset --workspace=web && npm run start --workspace=web'
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
    // ── 1. Auth setup (runs first, no storageState dependency) ──────────────
    {
      name: 'setup',
      testMatch: /e2e\/setup\/auth\.setup\.ts/,
    },

    // ── 2. Tests as an authenticated regular USER ────────────────────────────
    {
      name: 'as-user',
      dependencies: ['setup'],
      testIgnore: [/e2e\/setup\//, /e2e\/purchase\//, /e2e\/admin\//],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
    },

    // ── 3. Tests as an authenticated ADMIN ──────────────────────────────────
    {
      name: 'as-admin',
      dependencies: ['setup'],
      testMatch: /e2e\/admin\//,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
    },

    // ── 4. Fresh browser tests (no preloaded auth storage state) ─────────────
    {
      name: 'as-fresh-login',
      testMatch: /e2e\/purchase\//,
      use: {
        ...devices['Desktop Chrome'],
        // No storageState — browser starts with no session cookie
      },
    },
  ],
});
