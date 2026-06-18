import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

/**
 * Shared settings only. e2e and integration configs each call
 * defineConfig() themselves and spread this in — they are NOT Playwright
 * "projects" of one config, see playwright.config.ts header comment for
 * why they're deliberately kept as two separate config files.
 */
export const baseConfig = {
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure' as const,
    screenshot: 'only-on-failure' as const,
    video: 'retain-on-failure' as const,
  },
};

export default defineConfig(baseConfig);
