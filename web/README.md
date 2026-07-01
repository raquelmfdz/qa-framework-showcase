# Demo E-commerce App

A clean Next.js 14 App Router demo application built for Playwright end-to-end tests, accessibility audits, and performance/load testing.

## Setup

```bash
cd web
npm install
cp ../.env.example .env
npm run seed
npm run dev
```

Open `http://localhost:3000`.

## Accounts

- `user@example.com` / `!1passworD` (role: USER)
- `admin@example.com` / `Password1!` (role: admin)

## Scripts

- `npm run dev` - start development server
- `npm run build` - build production app
- `npm run start` - run production server
- `npm run seed` - seed SQLite database
