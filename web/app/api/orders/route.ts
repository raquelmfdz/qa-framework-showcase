import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { calculateCartTotal, isValidZipCode } from '../../../lib/business-rules';

const PAGE_SIZE = 6;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = Number(url.searchParams.get('limit') ?? PAGE_SIZE);
  const offset = (page - 1) * limit;

  // Admins see all orders; logged-in users see only their own
  if (session?.user?.role === 'ADMIN') {
    const orders = db
      .prepare(
        `SELECT id, customer_name, customer_last_name, customer_email,
                status, total, created_at
         FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?`
      )
      .all(limit, offset);
    return NextResponse.json(orders);
  }

  if (session?.user?.id) {
    const orders = db
      .prepare(
        `SELECT id, total, status, created_at, shipping_address
         FROM orders WHERE user_id = ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?`
      )
      .all(session.user.id, limit, offset);
    return NextResponse.json(orders);
  }

  // Unauthenticated — no order history available
  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const customerName = String(body.customerName || '').trim();
  const customerLastName = String(body.customerLastName || '').trim();
  const customerEmail = String(body.customerEmail || '').trim();
  const customerZipCode = String(body.customerZipCode || '').trim();
  const shippingAddress = String(body.shippingAddress || '').trim();

  if (
    !customerName ||
    !customerLastName ||
    !customerEmail ||
    !customerZipCode ||
    !shippingAddress
  ) {
    return new NextResponse('All fields are required', { status: 400 });
  }

  if (!isValidZipCode(customerZipCode)) {
    return new NextResponse('Invalid ZIP code', { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const guestToken = request.cookies.get('guest_token')?.value || '';

  const cartItems = userId
    ? (db
        .prepare(
          'SELECT ci.product_id, ci.quantity, p.price FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.user_id = ?'
        )
        .all(userId) as Array<{ product_id: number; quantity: number; price: number }>)
    : (db
        .prepare(
          'SELECT ci.product_id, ci.quantity, p.price FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.guest_token = ?'
        )
        .all(guestToken) as Array<{ product_id: number; quantity: number; price: number }>);

  if (!cartItems.length) {
    return new NextResponse('Cart is empty', { status: 400 });
  }

  const total = calculateCartTotal(
    cartItems.map((item) => ({ price: item.price, quantity: item.quantity }))
  );

  let orderId: number | bigint;

  try {
    const result = db
      .prepare(
        'INSERT INTO orders (user_id, customer_name, customer_last_name, customer_email, customer_zip_code, shipping_address, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        userId,
        customerName,
        customerLastName,
        customerEmail,
        customerZipCode,
        shippingAddress,
        total,
        'PROCESSING'
      );
    orderId = result.lastInsertRowid;

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
    );
    for (const item of cartItems) {
      insertItem.run(orderId, item.product_id, item.quantity, item.price);
    }

    // Clear the cart
    if (userId) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    } else {
      db.prepare('DELETE FROM cart_items WHERE guest_token = ?').run(guestToken);
    }
  } catch (err) {
    console.error('Order creation error:', err);
    return new NextResponse('Failed to create order', { status: 500 });
  }

  // Clear guest cookie only for guest checkout.
  const response = NextResponse.json({ id: orderId });
  if (!userId) {
    response.cookies.set('guest_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });
  }
  return response;
}
