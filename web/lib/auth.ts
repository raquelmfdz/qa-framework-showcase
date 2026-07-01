import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';

interface DbUser {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  name: string | null;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = db
          .prepare('SELECT id, email, password_hash, role, name FROM users WHERE email = ?')
          .get(credentials.email.toLowerCase().trim()) as DbUser | undefined;

        if (!user) return null;
        if (!bcrypt.compareSync(credentials.password, user.password_hash)) return null;

        return {
          id: String(user.id),
          email: user.email,
          // name will be null if not set — navbar falls back to email in that case
          name: user.name ?? null,
          role: String(user.role).toUpperCase(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign in, persist id, role and name into the token
      if (user) {
        token.id = user.id;
        token.role = String((user as { role: string }).role).toUpperCase();
        token.name = user.name ?? null;
      }
      // When update() is called from the profile page, refresh name in token
      if (trigger === 'update' && session?.name !== undefined) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = String(token.role ?? '').toUpperCase();
        session.user.name = token.name as string | null;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
};
