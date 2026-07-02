# QA Test Framework

Playwright + TypeScript QA suite for the demo e-commerce application, with unit tests in the app workspace to support test pyramid balance.

## Stack

| Layer                         | Tool                                                           |
| ----------------------------- | -------------------------------------------------------------- |
| Unit (business rules)         | [Vitest](https://vitest.dev/) in `web/`                        |
| API contracts                 | [Playwright](https://playwright.dev/) request tests            |
| Integration (UI + mocked API) | [Playwright](https://playwright.dev/)                          |
| E2E (real backend)            | [Playwright](https://playwright.dev/)                          |
| Accessibility                 | [axe-core](https://github.com/dequelabs/axe-core) + Playwright |
| Performance / Load            | [k6](https://k6.io/)                                           |
| Language                      | TypeScript 6                                                   |
| Auth                          | NextAuth v4 (Credentials + JWT session)                        |
| DB                            | SQLite (`better-sqlite3`)                                      |

## Quick Start

```bash
# from repo root
npm ci

# install browsers once
cd tests && npx playwright install chromium --with-deps
cd ../non-functional-tests/a11y && npx playwright install chromium --with-deps

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
│   │   ├── specs/
│   │   │   ├── public-pages.spec.ts
│   │   │   └── authenticated-pages.spec.ts
│   │   ├── axe-reports/                       # generated (git-ignored)
│   │   ├── playwright.a11y.config.ts
│   │   └── package.json
│   └── load/
│       └── scenarios/
│           ├── smoke.js                       # 1 VU health check — runs in CI
│           └── baseline-ramp.js               # ramp to 10 VUs — manual/scheduled
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
│   │   ├── admin/
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
│   │   └── data/
│   ├── playwright.base.config.ts
│   ├── playwright.config.ts
│   ├── playwright.integration.config.ts
│   ├── playwright.api.config.ts
│   ├── tsconfig.json
│   └── package.json
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

## CI Modes and Manual Layer Selection

This repository uses a common pattern for real-world CI setups: keep the default PR/commit path fast, and reserve the heavier matrix for scheduled or manual full runs.

- Push/PR runs: optimized default CI.
  - Always runs full lint, typecheck, build, and unit tests.
  - Runs smoke-only subsets for Playwright API, integration, and E2E (`@smoke`).
  - Runs a11y only when the PR/Push path is explicitly eligible for UI-related checks (for example, PRs that touch UI/auth/a11y files).
  - Does not run load/performance tests on push/PR.

- Manual run (`Run workflow` on `.github/workflows/ci-smoke-unit.yml`):
  - `test_scope` defaults to `smoke`.
  - In this default smoke mode, the workflow runs the lighter CI path: full unit tests plus smoke-level API/integration/E2E suites.
  - Accessibility and performance stay skipped unless you switch to `full` mode.
  - Layer checkboxes are available for advanced runs, but the intended default is to keep CI lightweight and use the full path only when needed.

- Nightly full run (`.github/workflows/nightly-full-suite.yml`):
  - Calls the reusable workflow in `full` mode.
  - Runs the full matrix: unit, API, integration, E2E, accessibility, and load/performance.

Notes:

- Unit tests are intentionally always full when the unit layer is selected.
- If a11y is selected, E2E auth-state generation is also executed so authenticated a11y checks have storage state available.

For K6 load tests (requires [k6 installed](https://k6.io/docs/get-started/installation/)):

```bash
# smoke — quick health check (1 VU, 30s)
npm run k6:smoke

# baseline ramp — latency baseline (10 VUs, ~2m)
npm run k6:ramp

# target a different environment
k6 run --env BASE_URL=https://staging.example.com non-functional-tests/load/scenarios/smoke.js
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

- E2E uses Playwright `globalSetup` in `tests/global.setup.ts`.
- Global setup logs in through NextAuth credentials flow and writes `tests/.auth/admin.json` and `tests/.auth/user.json` before E2E projects start.
- E2E projects (`as-user`, `as-admin`, `as-fresh-login`) consume storage states where appropriate rather than repeatedly using login UI.
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

## Accessibility Testing

- Axe-core checks run via Playwright against real app pages using WCAG 2.1 AA rules.
- **Critical and serious** violations fail the test immediately — these map directly to WCAG failure criteria.
- **Moderate and minor** violations are surfaced in the report but do not block CI, allowing progressive enforcement.
- Public pages (home, login, cart, checkout) are covered without auth.
- Authenticated pages (orders, profile, admin) require storage state generated by the E2E global setup step and fail fast if auth files are missing.
- Reports are saved to `non-functional-tests/a11y/axe-reports/` and uploaded as CI artifacts.

## Performance Testing

- K6 tests are API and page-level load tests, not browser-based — fast and low-cost to run.
- **`smoke.js`** is used for the lightweight CI path when the workflow is run in smoke mode: 1 VU for 30 seconds, validating that critical endpoints respond correctly under minimal load.
- **`baseline-ramp.js`** is used for the full/manual/nightly path: ramps to 10 VUs to establish p95 latency baselines and detect degradation over time.
- Thresholds enforced: p95 response time under 500–600ms, error rate under 1%.
- Auth-protected endpoint guardrails are included to verify 401/403 responses hold under load.

## Why Unit Tests In A QA Showcase

- Unit tests are included for shared business rules (`web/lib/business-rules.ts`) because these rules are reused by API routes and failures here cascade into higher layers.
- They provide fast, deterministic feedback on validation and normalization logic before running browser-heavy suites.
- This demonstrates shift-left QA collaboration without changing ownership of full product unit testing.

## Known Trade-offs

- Auth setup uses pre-generated storage state for most E2E tests to reduce runtime and flakiness; trade-off is reduced direct login-page coverage per test.
- Integration relies on route mocking for speed and determinism; trade-off is less confidence in full backend wiring compared to E2E.
- SQLite local DB keeps the showcase portable and simple; trade-off is less production parity if target systems use different DB engines.
- Some tests seed or clean orders through a direct SQLite connection while the app server is running; WAL + busy timeout reduce lock contention, but this can still be less stable than seeding through API-only flows under heavy parallelism.
- Unit coverage is focused on shared rule helpers rather than every UI function; trade-off is deliberate to keep QA effort concentrated on risk-heavy logic.

## Spotted Bugs (Already Solved)

### Spotted Through Automation

- Admin protected-route tests were asserting page-level access denied states even though middleware redirected earlier; tests were aligned to the real middleware behavior. Test note: admin access assertions were updated in E2E and integration coverage.
- API CI startup was missing seeded data, which broke product and cross-user contract checks; CI now seeds before startup. Test note: API contract coverage now runs with seeded CI startup.
- Login return-to flow was broken because middleware used `redirect` while the login page only read `callbackUrl`; both now work together and the round-trip is covered. Test note: session security E2E now verifies logout -> protected route -> login -> return flow.
- Middleware was importing a server-only auth module into the Edge runtime, which pulled in `better-sqlite3` and broke protected pages after login; auth secret handling was split into an Edge-safe module. Test note: protected-route E2E coverage now exercises the fixed middleware path.

### Spotted Through Manual Testing

- Cart badge count stayed stale after checkout; checkout now clears cart state and dispatches a cart refresh before redirect. Test note: purchase happy-path E2E now asserts the cart badge resets after order placement.
- Cart quantity edits caused a disruptive page reload/loading flash; cart updates now happen locally and refresh the shared cart count without reloading the whole view. Test note: cart integration coverage verifies quantity changes do not re-trigger the full-page loading state.
- Invalid ZIP codes only failed on submit with no guidance; checkout now shows the expected 5-digit format and validates it client-side before submitting. Test note: checkout integration coverage now verifies ZIP guidance and invalid-state behavior.
- Invalid characters in cart quantity could collapse into an unintended item removal; quantity input is now limited to numeric entry and ignores invalid characters. Test note: cart integration coverage verifies invalid character input does not change quantity or remove the item.
