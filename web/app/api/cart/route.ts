import { db } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const COOKIE_NAME = 'guest_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

async function getCartIdentifier(request: NextRequest) {
  const guestToken = request.cookies.get(COOKIE_NAME)?.value || null;
  let activeGuestToken = guestToken;
  let setGuestCookie = false;

  if (!guestToken) {
    activeGuestToken = randomUUID();
    setGuestCookie = true;
  }

  return { guestToken: activeGuestToken, setGuestCookie };
}

export async function GET(request: NextRequest) {
  const { guestToken, setGuestCookie } = await getCartIdentifier(request);
  const items = db
    .prepare(
      'SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.image_url FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.guest_token = ?'
    )
    .all(guestToken);

  const response = NextResponse.json(items);
  if (setGuestCookie && guestToken) {
    response.cookies.set(COOKIE_NAME, guestToken, COOKIE_OPTIONS);
  }
  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const productId = Number(body.productId);
  const quantity = Number(body.quantity ?? 1);

  if (!productId || quantity < 1) {
    return new NextResponse('Invalid request body', { status: 400 });
  }

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) {
    return new NextResponse('Product not found', { status: 404 });
  }

  const { guestToken, setGuestCookie } = await getCartIdentifier(request);
  const existing = db
    .prepare('SELECT id, quantity FROM cart_items WHERE guest_token = ? AND product_id = ?')
    .get(guestToken, productId) as { id: number; quantity: number } | undefined;

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(
      existing.quantity + quantity,
      existing.id
    );
  } else {
    db.prepare('INSERT INTO cart_items (guest_token, product_id, quantity) VALUES (?, ?, ?)').run(
      guestToken,
      productId,
      quantity
    );
  }

  const response = NextResponse.json({ success: true });
  if (setGuestCookie && guestToken) {
    response.cookies.set(COOKIE_NAME, guestToken, COOKIE_OPTIONS);
  }

  return response;
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const productId = Number(body.productId);
  const quantity = Number(body.quantity);

  if (!productId || quantity < 0) {
    return new NextResponse('Invalid request body', { status: 400 });
  }

  const { guestToken } = await getCartIdentifier(request);
  const identifier = guestToken;

  if (quantity === 0) {
    db.prepare('DELETE FROM cart_items WHERE product_id = ? AND guest_token = ?').run(
      productId,
      identifier
    );
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE product_id = ? AND guest_token = ?').run(
      quantity,
      productId,
      identifier
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const productId = body.productId ? Number(body.productId) : null;
  const { guestToken } = await getCartIdentifier(request);
  const identifier = guestToken;

  if (productId) {
    db.prepare('DELETE FROM cart_items WHERE product_id = ? AND guest_token = ?').run(
      productId,
      identifier
    );
  } else {
    db.prepare('DELETE FROM cart_items WHERE guest_token = ?').run(identifier);
  }

  return NextResponse.json({ success: true });
}
