import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { parseOrderId, validateOrderStatusUpdate } from '../../../../../lib/business-rules';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // Admin only
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (session.user.role !== 'admin' && session.user.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const orderId = parseOrderId(params.id);
  if (!orderId) {
    return new NextResponse('Invalid order ID', { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const statusValidation = validateOrderStatusUpdate({ status: body.status });
  if (!statusValidation.valid) {
    return new NextResponse(statusValidation.message, { status: 400 });
  }

  // Check the order exists before updating
  const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(orderId);
  if (!existing) {
    return new NextResponse('Order not found', { status: 404 });
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(
    statusValidation.normalizedStatus,
    orderId
  );

  return NextResponse.json({ success: true });
}
