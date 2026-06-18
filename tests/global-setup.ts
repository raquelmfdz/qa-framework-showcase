import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Runs once before the whole suite (e2e or integration).
 *
 * Why this exists:
 * `web/scripts/seed.ts` is intentionally non-destructive (it only inserts
 * products/users if missing), which is the right call for local dev — but it
 * means leftover orders/cart_items from a previous test run would leak into
 * the next one. Tests that assert "user has 0 orders" or "cart is empty"
 * would become flaky depending on run history.
 *
 * To keep every run hermetic we delete the sqlite file outright and let
 * `npm run seed` (invoked by the Next.js `dev`/`start` script, see web/package.json)
 * recreate it from scratch. This mirrors `web`'s own `db:reset` script.
 */
async function globalSetup(_config: FullConfig) {
  const dbFile = process.env.DATABASE_FILE ?? '../web/dev.db';
  const resolvedPath = path.resolve(__dirname, dbFile);

  if (fs.existsSync(resolvedPath)) {
    fs.rmSync(resolvedPath);
    console.log(`[global-setup] Removed stale DB at ${resolvedPath}`);
  }

  // Re-seed synchronously so the webServer boots against a fresh DB.
  // Runs from the web/ workspace so relative paths inside seed.ts resolve correctly.
  const webDir = path.resolve(__dirname, '../web');
  execSync('npm run seed', { cwd: webDir, stdio: 'inherit' });
}

export default globalSetup;
