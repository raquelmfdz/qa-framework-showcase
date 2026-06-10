import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';

interface DbUser {
  id: number;
  email: string;
  password_hash: string;
  role: string;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = db
          .prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?')
          .get(credentials.email.toLowerCase().trim()) as DbUser | undefined;

        if (!user) return null;

        const passwordValid = bcrypt.compareSync(credentials.password, user.password_hash);
        if (!passwordValid) return null;

        // This object is encoded into the JWT token
        return {
          id: String(user.id),
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Persist id and role into the token on sign in
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { id: string; role: string }).role;
      }
      return token;
    },
    // Expose id and role on the session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
