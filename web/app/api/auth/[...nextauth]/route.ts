import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import bcrypt from 'bcryptjs';

// Basic email format check — not exhaustive but catches obvious garbage
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const email = String(body.email ?? '')
    .trim()
    .toLowerCase();
  const password = String(body.password ?? '').trim();
  const name = String(body.name ?? '').trim();

  // Validate required fields
  if (!email || !password) {
    return new NextResponse('Email and password are required', { status: 400 });
  }

  if (!isValidEmail(email)) {
    return new NextResponse('Invalid email address', { status: 400 });
  }

  // Enforce a minimum password length
  if (password.length < 6) {
    return new NextResponse('Password must be at least 6 characters', { status: 400 });
  }

  // Check if email is already taken
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return new NextResponse('An account with this email already exists', { status: 400 });
  }

  // Hash password and insert new user with default USER role
  const passwordHash = bcrypt.hashSync(password, 10);

  try {
    db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(
      email,
      passwordHash,
      'USER'
    );
  } catch (err) {
    console.error('Register error:', err);
    return new NextResponse('Failed to create account', { status: 500 });
  }

  return NextResponse.json({ success: true, user: { email, name } }, { status: 201 });
}
