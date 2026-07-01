import { APIRequestContext, expect } from '@playwright/test';

/**
 * Logs a user in by talking directly to NextAuth's REST endpoints —
 * no browser, no UI interaction. Used by Playwright globalSetup to
 * produce a storageState per role (see playwright.config.ts -> projects).
 *
 * NextAuth v4 Credentials flow:
 *  1. GET /api/auth/csrf       -> { csrfToken } and sets a csrf cookie
 *  2. POST /api/auth/callback/credentials
 *       body: { email, password, csrfToken, json: 'true' }
 *     On success sets the `next-auth.session-token` cookie.
 *
 * Retries up to 3 times to tolerate slow CI startup before the server
 * is fully ready to accept credentials.
 */
export async function loginViaApi(
  request: APIRequestContext,
  baseURL: string,
  credentials: { email: string; password: string }
): Promise<void> {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const csrfResponse = await request.get(`${baseURL}/api/auth/csrf`);
    if (!csrfResponse.ok()) {
      lastStatus = csrfResponse.status();
      continue;
    }

    const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

    const loginResponse = await request.post(`${baseURL}/api/auth/callback/credentials`, {
      form: {
        email: credentials.email,
        password: credentials.password,
        csrfToken,
        json: 'true',
      },
    });

    lastStatus = loginResponse.status();
    if (!loginResponse.ok()) {
      continue;
    }

    const cookies = await request.storageState();
    const hasSessionCookie = cookies.cookies.some(
      (c) => c.name.includes('next-auth.session-token') || c.name.includes('authjs.session-token')
    );

    if (hasSessionCookie) {
      return;
    }
  }

  expect(
    false,
    `Login appeared to succeed but no session cookie was set for ${credentials.email} after retries ` +
      `(last status: ${lastStatus}). Check auth configuration and seeded credentials.`
  ).toBeTruthy();
}
