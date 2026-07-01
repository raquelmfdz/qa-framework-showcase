import { APIRequestContext, expect } from '@playwright/test';

/**
 * Logs a user in by talking directly to NextAuth's REST endpoints —
 * no browser, no UI interaction. Used by the auth setup project to
 * produce a storageState per role (see playwright.config.ts -> projects).
 *
 * NextAuth v4 Credentials flow, two requests:
 *  1. GET /api/auth/csrf       -> { csrfToken } and sets a csrf cookie
 *  2. POST /api/auth/callback/credentials
 *       body: { email, password, csrfToken, json: 'true' }
 *     On success this returns a redirect (302) and sets the
 *     `next-auth.session-token` cookie (or `__Secure-` prefixed under HTTPS).
 *
 * Note: we deliberately do NOT follow the redirect for assertions — we only
 * care about the Set-Cookie header. APIRequestContext follows redirects by
 * default, which is fine here since the final response is still 200/302 and
 * the cookie is already persisted into `request`'s cookie jar at that point.
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
