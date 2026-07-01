import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const PAGE_SIZE = 6;

interface AdminOrder {
  id: number;
  customer_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_zip_code: string;
  shipping_address: string;
  status: string;
  total: number;
  created_at: string;
}

export async function GET(request: NextRequest) {
  // Only admins can access this endpoint
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Pagination
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = Number(url.searchParams.get('limit') ?? PAGE_SIZE);
  const offset = (page - 1) * limit;

  const orders = db
    .prepare(
      `SELECT
        id, customer_name, customer_last_name, customer_email,
        customer_zip_code, shipping_address, status, total, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as AdminOrder[];

  return NextResponse.json(orders);
}
