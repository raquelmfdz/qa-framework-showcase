import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

// Valid status transitions — keeps bad data out of the DB
const VALID_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // Admin only
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const orderId = Number(params.id);
  if (!orderId || isNaN(orderId)) {
    return new NextResponse('Invalid order ID', { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const status = String(body.status ?? '')
    .trim()
    .toUpperCase();

  if (!status || !VALID_STATUSES.includes(status)) {
    return new NextResponse(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, {
      status: 400,
    });
  }

  // Check the order exists before updating
  const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(orderId);
  if (!existing) {
    return new NextResponse('Order not found', { status: 404 });
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);

  return NextResponse.json({ success: true });
}
