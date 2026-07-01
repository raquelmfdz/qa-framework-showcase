import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import { normalizeEmail, validateRegistrationInput } from '../../../../lib/business-rules';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const email = normalizeEmail(String(body.email ?? ''));
  const password = String(body.password ?? '').trim();
  const name = String(body.name ?? '').trim();

  const validation = validateRegistrationInput({ email, password });
  if (!validation.valid) {
    return new NextResponse(validation.message, { status: 400 });
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
