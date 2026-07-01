import { test as setup } from '@playwright/test';
import { loginViaApi } from '../../src/helpers/auth-api';
import { SEED_USERS } from '../../src/data/users';

/**
 * Runs as its own Playwright project (see playwright.config.ts) with
 * `dependencies: ['setup']` wired into the e2e projects. Each run produces
 * a fresh storageState JSON file under .auth/ — these are git-ignored and
 * regenerated every execution, so there is no risk of a stale/expired
 * session cookie leaking between CI runs (the concern raised earlier).
 */
setup('authenticate as admin', async ({ request, baseURL }) => {
  await loginViaApi(request, baseURL!, SEED_USERS.admin);
  await request.storageState({ path: '.auth/admin.json' });
});

setup('authenticate as user', async ({ request, baseURL }) => {
  await loginViaApi(request, baseURL!, SEED_USERS.user);
  await request.storageState({ path: '.auth/user.json' });
});
