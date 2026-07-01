import { db } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

const COOKIE_NAME = 'guest_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

async function getCartIdentifier(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const guestToken = request.cookies.get(COOKIE_NAME)?.value || null;
  let activeGuestToken = guestToken;
  let setGuestCookie = false;

  if (!guestToken) {
    activeGuestToken = randomUUID();
    setGuestCookie = true;
  }

  // Merge anonymous cart into account cart once the user is authenticated.
  if (userId && guestToken) {
    const guestItems = db
      .prepare('SELECT product_id, quantity FROM cart_items WHERE guest_token = ?')
      .all(guestToken) as Array<{ product_id: number; quantity: number }>;

    const existingByUser = db.prepare(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?'
    );
    const updateQty = db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?');
    const insertForUser = db.prepare(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)'
    );

    for (const item of guestItems) {
      const existing = existingByUser.get(userId, item.product_id) as
        | { id: number; quantity: number }
        | undefined;
      if (existing) {
        updateQty.run(existing.quantity + item.quantity, existing.id);
      } else {
        insertForUser.run(userId, item.product_id, item.quantity);
      }
    }

    db.prepare('DELETE FROM cart_items WHERE guest_token = ?').run(guestToken);
  }

  return { userId, guestToken: activeGuestToken, setGuestCookie };
}

export async function GET(request: NextRequest) {
  const { userId, guestToken, setGuestCookie } = await getCartIdentifier(request);
  const items = userId
    ? db
        .prepare(
          'SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.image_url FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.user_id = ?'
        )
        .all(userId)
    : db
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

  const { userId, guestToken, setGuestCookie } = await getCartIdentifier(request);
  const existing = userId
    ? (db
        .prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?')
        .get(userId, productId) as { id: number; quantity: number } | undefined)
    : (db
        .prepare('SELECT id, quantity FROM cart_items WHERE guest_token = ? AND product_id = ?')
        .get(guestToken, productId) as { id: number; quantity: number } | undefined);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(
      existing.quantity + quantity,
      existing.id
    );
  } else {
    if (userId) {
      db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(
        userId,
        productId,
        quantity
      );
    } else {
      db.prepare('INSERT INTO cart_items (guest_token, product_id, quantity) VALUES (?, ?, ?)').run(
        guestToken,
        productId,
        quantity
      );
    }
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

  const { userId, guestToken } = await getCartIdentifier(request);

  if (quantity === 0) {
    if (userId) {
      db.prepare('DELETE FROM cart_items WHERE product_id = ? AND user_id = ?').run(
        productId,
        userId
      );
    } else {
      db.prepare('DELETE FROM cart_items WHERE product_id = ? AND guest_token = ?').run(
        productId,
        guestToken
      );
    }
  } else {
    if (userId) {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE product_id = ? AND user_id = ?').run(
        quantity,
        productId,
        userId
      );
    } else {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE product_id = ? AND guest_token = ?').run(
        quantity,
        productId,
        guestToken
      );
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const productId = body.productId ? Number(body.productId) : null;
  const { userId, guestToken } = await getCartIdentifier(request);

  if (productId) {
    if (userId) {
      db.prepare('DELETE FROM cart_items WHERE product_id = ? AND user_id = ?').run(
        productId,
        userId
      );
    } else {
      db.prepare('DELETE FROM cart_items WHERE product_id = ? AND guest_token = ?').run(
        productId,
        guestToken
      );
    }
  } else {
    if (userId) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    } else {
      db.prepare('DELETE FROM cart_items WHERE guest_token = ?').run(guestToken);
    }
  }

  return NextResponse.json({ success: true });
}
