import { defineConfig } from '@playwright/test';

export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

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
