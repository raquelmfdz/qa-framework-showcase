# QA Test Framework

Playwright + TypeScript QA suite for the demo e-commerce application, with unit tests in the app workspace to support test pyramid balance.

## Stack

| Layer                         | Tool                                                |
| ----------------------------- | --------------------------------------------------- |
| Unit (business rules)         | [Vitest](https://vitest.dev/) in `web/`             |
| API contracts                 | [Playwright](https://playwright.dev/) request tests |
| Integration (UI + mocked API) | [Playwright](https://playwright.dev/)               |
| E2E (real backend)            | [Playwright](https://playwright.dev/)               |
| Language                      | TypeScript 5                                        |
| Auth                          | NextAuth v4 (Credentials + JWT session)             |
| DB                            | SQLite (`better-sqlite3`)                           |

## Quick Start

```bash
# from repo root
npm ci

# install browser once
cd tests && npx playwright install chromium --with-deps

# back to root and configure env
cd ..
cp .env.example .env

# seed DB
npm run seed

# run all layers independently
npm run test:unit
npm run test:api
npm run test:integration
npm run test:e2e
```

Local tip: Playwright configs reuse an existing server on port 3000 when available; otherwise Playwright starts the app automatically.

## Project Structure

```text
playwright-qa-framework-showcase/
├── .github/
│   └── workflows/
├── .husky/
├── .gitignore
├── .prettierrc
├── .env.example
├── eslint.config.mjs
├── tsconfig.base.json
├── package.json                        # monorepo root scripts
├── package-lock.json
├── non-functional-tests/
│   ├── a11y/
│   └── load/
│
├── web/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── login/
│   │   ├── order/
│   │   ├── orders/
│   │   ├── profile/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── styles/
│   ├── types/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── business-rules.ts         # shared pure validation/business helpers
│   │   ├── db.ts
│   │   └── hash.ts
│   ├── scripts/seed.ts
│   ├── unit/
│   │   └── business-logic.spec.ts    # Vitest unit tests
│   ├── package.json
│   ├── next.config.mjs
│   ├── postcss.config.cjs
│   ├── tailwind.config.cjs
│   ├── tsconfig.seed.json
│   └── tsconfig.json
│
├── tests/
│   ├── .auth/                         # generated storage state (git-ignored)
│   ├── e2e/
│   │   ├── setup/
│   │   │   └── auth.setup.ts         # auth setup project
│   │   ├── admin/
│   │   │   ├── admin-orders-access.spec.ts
│   │   │   └── admin-permissions-lifecycle.spec.ts
│   │   ├── orders/
│   │   │   └── existing-orders-history.spec.ts
│   │   ├── purchase/
│   │   │   └── purchase-happy-path.spec.ts
│   │   └── session/
│   │       └── logout-security.spec.ts
│   ├── integration/
│   │   ├── admin-api-states.spec.ts
│   │   ├── catalog-api-states.spec.ts
│   │   ├── checkout-api-states.spec.ts
│   │   └── orders-api-states.spec.ts
│   ├── api/
│   │   └── contracts.spec.ts
│   ├── src/
│   │   ├── fixtures/
│   │   ├── helpers/
│   │   ├── pages/
│   │   ├── data/
│   │   └── utils/
│   ├── playwright.base.config.ts
│   ├── playwright.config.ts
│   ├── playwright.integration.config.ts
│   ├── playwright.api.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── global-setup.ts
```

## Commands

From repo root:

```bash
npm run dev
npm run build
npm run start
npm run seed

npm run test:unit
npm run test:api
npm run test:integration
npm run test:e2e
npm run test:a11y
```

From `tests/` workspace:

```bash
npm run test:api
npm run test:integration
npm run test:e2e

npm run report:api
npm run report:integration
npm run report:e2e
```

## Auth Setup and Test Authentication

- E2E uses a setup project in `tests/e2e/setup/auth.setup.ts`.
- Setup logs in through NextAuth credentials flow and writes `tests/.auth/admin.json` and `tests/.auth/user.json`.
- E2E projects (`as-user`, `as-admin`, `as-guest`) consume storage states rather than repeatedly using login UI.
- Integration tests do not require real auth; they mock `/api/auth/session` via `mockSession()`.

## Database Choice and Test Isolation

- Database engine is local SQLite (`better-sqlite3`) with file `web/dev.db`.
- E2E CI startup uses `db:reset` before `start` so auth setup always runs against fresh seeded users.
- Integration CI startup uses `seed` before `start` to keep SSR catalog data deterministic without destructive reset.
- Seed script creates baseline catalog and two deterministic users (admin + regular user).
- API/integration tests remain isolated by mocking responses or using validation-only calls.

## CI Determinism Note

- E2E and integration use different DB boot strategies on purpose.
- E2E is destructive (`db:reset`) because it depends on auth setup and user/session consistency from a blank state.
- Integration is non-destructive (`seed`) because tests are mostly mocked and only require baseline catalog presence for SSR pages.

## Why Unit Tests In A QA Showcase

- Unit tests are included for shared business rules (`web/lib/business-rules.ts`) because these rules are reused by API routes and failures here cascade into higher layers.
- They provide fast, deterministic feedback on validation and normalization logic before running browser-heavy suites.
- This demonstrates shift-left QA collaboration without changing ownership of full product unit testing.

## Known Trade-offs

- Auth setup uses pre-generated storage state for most E2E tests to reduce runtime and flakiness; trade-off is reduced direct login-page coverage per test.
- Integration relies on route mocking for speed and determinism; trade-off is less confidence in full backend wiring compared to E2E.
- SQLite local DB keeps the showcase portable and simple; trade-off is less production parity if target systems use different DB engines.
- Unit coverage is focused on shared rule helpers rather than every UI function; trade-off is deliberate to keep QA effort concentrated on risk-heavy logic.
