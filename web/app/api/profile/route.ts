import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { db } from '../../../lib/db';

interface UserProfile {
  email: string;
  name: string | null;
  last_name: string | null;
  zip_code: string | null;
  address: string | null;
}

// GET /api/profile — returns the current user's profile fields
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = db
    .prepare('SELECT email, name, last_name, zip_code, address FROM users WHERE id = ?')
    .get(session.user.id) as UserProfile | undefined;

  if (!user) return new NextResponse('User not found', { status: 404 });

  return NextResponse.json(user);
}

// PATCH /api/profile — updates name, last_name, zip_code, address (email never changes)
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? '').trim();
  const lastName = String(body.lastName ?? '').trim();
  const zipCode = String(body.zipCode ?? '').trim();
  const address = String(body.address ?? '').trim();

  db.prepare(
    'UPDATE users SET name = ?, last_name = ?, zip_code = ?, address = ? WHERE id = ?'
  ).run(name || null, lastName || null, zipCode || null, address || null, session.user.id);

  return NextResponse.json({ success: true });
}
