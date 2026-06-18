/**
 * Mirrors the users created by web/scripts/seed.ts.
 * Keep this file in sync if the seed script changes.
 *
 * Note the inconsistent role casing coming from the app itself:
 * admin's role is 'admin' (lowercase) but the regular user's role is
 * 'USER' (uppercase) — see seed.ts insert statements. Tests asserting
 * on `session.user.role` must respect this exactly, it is not a typo
 * here, it reflects real app data.
 */
export const SEED_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'Password1!',
    role: 'admin',
    name: 'Admin',
    lastName: 'McAdminface',
  },
  user: {
    email: 'user@example.com',
    password: 'Password1!',
    role: 'USER',
    name: 'Regular',
    lastName: 'McUserton',
  },
} as const;

export type SeedUserKey = keyof typeof SEED_USERS;
