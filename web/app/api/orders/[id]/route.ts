import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { parseOrderId } from '../../../../lib/business-rules';

// Types matching the DB schema
interface Order {
  id: number;
  user_id: number | null;
  customer_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_zip_code: string;
  shipping_address: string;
  status: string;
  total: number;
  created_at: string;
}

interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const orderId = parseOrderId(params.id);

  // Validate the id param is a real number
  if (!orderId) {
    return new NextResponse('Invalid order ID', { status: 400 });
  }

  // Fetch the order row
  const order = db
    .prepare(
      `SELECT
        id, user_id, customer_name, customer_last_name,
        customer_email, customer_zip_code, shipping_address,
        status, total, created_at
       FROM orders
       WHERE id = ?`
    )
    .get(orderId) as Order | undefined;

  if (!order) {
    return new NextResponse('Order not found', { status: 404 });
  }

  // Fetch the items for this order, joining product name for display
  const items = db
    .prepare(
      `SELECT
        oi.product_id,
        p.name AS product_name,
        p.image_url,
        oi.quantity,
        oi.unit_price
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`
    )
    .all(orderId) as OrderItem[];

  return NextResponse.json({ order, items });
}
