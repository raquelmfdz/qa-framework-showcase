# Test Framework

Playwright + TypeScript test suite for the demo e-commerce app.

## Stack

| Layer                | Tool                                                    |
| -------------------- | ------------------------------------------------------- |
| E2E & Integration    | [Playwright](https://playwright.dev/)                   |
| Unit (lógica de app) | [Vitest](https://vitest.dev/) — vive en `web/`, no aquí |
| Language             | TypeScript 5                                            |
| Auth                 | NextAuth v4 (Credentials + JWT)                         |
| DB                   | SQLite via better-sqlite3                               |

---

## Quick start

```bash
# From repo root — installs all workspaces
npm ci

# Install Playwright browsers (run once)
cd tests && npx playwright install chromium --with-deps

# Copy env file
cp .env.example .env

# Make sure the app is seeded (run from repo root)
npm run seed

# Run tests
npm run test:unit          # Vitest en web/ — lógica pura de la app, sin servidor
npm run test:integration   # Playwright, mocked API
npm run test:e2e           # Playwright, real backend
```

> **Local tip:** `test:e2e` and `test:integration` will reuse a running `npm run dev`
> server if one is already on port 3000. If nothing is running, Playwright boots it
> automatically. You don't need to start the server manually.

---

## Folder structure

```
tests/
├── e2e/                        # E2E specs (real DB, real auth)
│   ├── auth/                   # Login, logout, redirects
│   ├── catalog/                # Product grid (public, no auth)
│   ├── cart/                   # Add/remove/update cart items
│   ├── checkout/               # Full purchase flow
│   ├── orders/                 # User order history
│   ├── profile/                # Profile update
│   ├── admin/                  # Admin order management
│   └── auth.setup.ts           # Playwright setup project (generates .auth/*.json)
│
├── integration/                # UI tests with page.route() mocking
│   ├── catalog/                # API error/empty states for product grid
│   ├── checkout/               # API error states for order placement
│   ├── orders/                 # API states for order history
│   └── admin/                  # API states + access control for admin panel
│
├── unit/                       # Vitest unit tests for pure utilities
│
├── src/
│   ├── pages/                  # Page Objects (one per app page/route)
│   │   └── components/         # Component Objects (Navbar, etc.)
│   ├── fixtures/               # Playwright fixture extensions (Page Objects injection)
│   ├── helpers/                # auth-api.ts, mock-session.ts, api-data.ts
│   ├── data/                   # Seed mirrors: users.ts, products.ts
│   └── utils/                  # Pure utility functions (tested by Vitest)
│
├── playwright.config.ts        # E2E config (4 projects: setup/as-user/as-admin/as-guest)
├── playwright.integration.config.ts
├── playwright.base.config.ts   # Shared settings
├── global-setup.ts             # Resets SQLite DB before every run
└── .env.example                # Env var reference
```

---

## Authentication strategy

E2E tests use a **setup project** (`auth.setup.ts`) that runs before the suite:

1. Calls `/api/auth/csrf` to get a CSRF token (required by NextAuth v4).
2. POSTs credentials to `/api/auth/callback/credentials`.
3. Saves the resulting `next-auth.session-token` cookie to `.auth/user.json`
   and `.auth/admin.json`.

Test projects declare `dependencies: ['setup']` and load the appropriate
`storageState`, so **no test ever touches the login UI** except the dedicated
auth specs under `e2e/auth/`.

Integration tests use `mockSession()` from `src/helpers/mock-session.ts`,
which intercepts `/api/auth/session` via `page.route()` — no real auth needed.

The `.auth/` folder is **git-ignored**. Tokens are regenerated on every run.

---

## Database isolation

`global-setup.ts` deletes `web/dev.db` and re-runs `npm run seed` before
each full test run. This means:

- Every run starts with exactly the 12 seeded products and 2 seeded users.
- No leftover orders/cart items from previous runs.

Within a run, tests that need a clean cart call `clearCart()` from
`src/helpers/api-data.ts` in `beforeEach`.

---

## Tagging and filtering

Tests tagged `@smoke` are the minimal set covering critical happy paths.
Run them with:

```bash
npm run test:e2e -- --grep @smoke
```

---

## Adding a new E2E test

1. Create (or reuse) a Page Object in `src/pages/`.
2. Add the spec under the correct `e2e/<feature>/` folder.
3. Import `{ test, expect }` from `../../src/fixtures/pages.fixture`.
4. If the test needs auth, confirm it's under a folder matched by the
   right project in `playwright.config.ts` (`as-user`, `as-admin`, `as-guest`).
5. Use `@smoke` in the test name if it covers a critical happy path.

## Adding a new Integration test

1. Add the spec under `integration/<feature>/`.
2. Call `mockSession(page, 'user' | 'admin' | 'guest')` **before** `page.goto()`.
3. Use `page.route('**/api/...')` to control API responses.
4. No DB state, no `beforeEach` cleanup needed — tests are self-contained.

---

## Selectors convention

All Page Objects use, in order of preference:

1. `getByRole()` — semantic, accessible, most robust.
2. `getByLabel()` — for form inputs with proper `<label>` wiring.
3. `getByTestId()` — for elements without good semantic attributes.
   Add `data-testid="..."` to the component when needed.
4. `getByText()` — only for assertions, not for clicks/interactions.

Avoid CSS class selectors and XPath. Tailwind class names change; roles don't.

---

## CI/CD

The GitHub Actions workflow (`.github/workflows/qa.yml`) runs three jobs:

- **unit** — always, on every push/PR, no server.
- **integration** — always, parallel to unit.
- **e2e** — after unit passes; boots the Next.js production build.

Reports are uploaded as artifacts and retained for 14 days.
Traces and screenshots on failure are retained for 7 days.
