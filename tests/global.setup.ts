import fs from 'node:fs/promises';
import path from 'node:path';
import { request, type FullConfig } from '@playwright/test';
import { loginViaApi } from './src/helpers/auth-api';
import { SEED_USERS } from './src/data/users';

export default async function globalSetup(config: FullConfig) {
  const authDir = path.resolve(__dirname, '.auth');
  await fs.mkdir(authDir, { recursive: true });

  const baseURL = String(config.projects[0]?.use?.baseURL ?? 'http://localhost:3000');

  const adminContext = await request.newContext({ baseURL });
  await loginViaApi(adminContext, baseURL, SEED_USERS.admin);
  await adminContext.storageState({ path: path.join(authDir, 'admin.json') });
  await adminContext.dispose();

  const userContext = await request.newContext({ baseURL });
  await loginViaApi(userContext, baseURL, SEED_USERS.user);
  await userContext.storageState({ path: path.join(authDir, 'user.json') });
  await userContext.dispose();
}
