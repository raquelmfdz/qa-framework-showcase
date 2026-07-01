/**
 * Mirrors the users created by web/scripts/seed.ts.
 * Keep this file in sync if the seed script changes.
 */
export const SEED_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'Password1!',
    role: 'ADMIN',
    name: 'Admin',
    lastName: 'McAdminface',
  },
  user: {
    email: 'user@example.com',
    password: '!1passworD',
    role: 'USER',
    name: 'Regular',
    lastName: 'McUserton',
  },
} as const;

export type SeedUserKey = keyof typeof SEED_USERS;
