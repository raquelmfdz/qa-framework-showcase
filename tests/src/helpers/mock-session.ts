import { Page } from '@playwright/test';
import { SEED_USERS } from '../data/users';
import { resolveUserIdByEmail } from './orders-api';

type Role = 'user' | 'admin' | 'guest';

/**
 * Mocks /api/auth/session so Next.js (client-side) thinks there is an
 * active session. Used in integration tests to avoid a real auth round-trip
 * while still exercising authenticated UI paths.
 *
 * Must be called BEFORE page.goto(), because Next.js fetches the session
 * on the initial render.
 */
export async function mockSession(page: Page, role: Role = 'user'): Promise<void> {
  if (role === 'guest') {
    await page.route('**/api/auth/session**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    return;
  }

  const seedUser = SEED_USERS[role];
  const userId = resolveUserIdByEmail(seedUser.email);
  const session = {
    user: {
      id: String(userId),
      email: seedUser.email,
      name: seedUser.name,
      role: seedUser.role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  await page.route('**/api/auth/session**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    })
  );
}
