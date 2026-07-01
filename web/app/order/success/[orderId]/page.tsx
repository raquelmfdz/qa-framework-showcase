import { db } from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { notFound, redirect } from 'next/navigation';
import { parseOrderId } from '../../../../lib/business-rules';

// Proper types instead of any — matches the DB schema exactly
interface OrderRow {
  id: number;
  user_id: number | null;
  total: number;
  created_at: string;
  status: string;
  customer_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_zip_code: string;
  shipping_address: string;
}

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  name: string;
}

export default async function OrderSuccessPage({ params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?redirect=/order/success/${params.orderId}`);
  }

  const parsedOrderId = parseOrderId(params.orderId);
  if (!parsedOrderId) {
    notFound();
  }

  const order = db
    .prepare(
      `SELECT id, user_id, total, created_at, status, customer_name, customer_last_name,
       customer_email, customer_zip_code, shipping_address
       FROM orders WHERE id = ?`
    )
    .get(parsedOrderId) as OrderRow | undefined;

  if (!order) {
    notFound();
  }

  const isAdmin = session.user.role === 'ADMIN';
  const isOwner = Number(session.user.id) === order.user_id;
  if (!isAdmin && !isOwner) {
    notFound();
  }

  const items = db
    .prepare(
      `SELECT oi.quantity, oi.unit_price, p.name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`
    )
    .all(order.id) as OrderItemRow[];

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[28px] border border-orange-500/10 p-6 shadow-2xl shadow-orange-950/20">
        <h1 className="text-3xl font-semibold text-slate-100">Order placed successfully</h1>
        <p className="mt-2 text-slate-300">
          Thank you for your purchase! Your order number is{' '}
          <span data-testid="order-id" className="font-bold text-orange-200">
            #{order.id}
          </span>
        </p>
      </div>

      <div className="glass-panel rounded-[28px] border border-orange-500/10 p-6 shadow-2xl shadow-orange-950/20">
        <h2 className="text-lg font-semibold text-slate-100">Order Information</h2>
        <div className="mt-4 space-y-3 text-slate-300">
          <p>
            <span className="text-slate-400">Order Date:</span>{' '}
            {new Date(order.created_at).toLocaleString()}
          </p>
          <p>
            <span className="text-slate-400">Status:</span>{' '}
            <span className="inline-block rounded-full bg-green-900/40 px-3 py-1 text-sm font-semibold text-green-200">
              {order.status}
            </span>
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-[28px] border border-orange-500/10 p-6 shadow-2xl shadow-orange-950/20">
        <h2 className="text-lg font-semibold text-slate-100">Customer Information</h2>
        <div className="mt-4 space-y-2 text-slate-300">
          <p>
            <span className="text-slate-400">Name:</span> {order.customer_name}{' '}
            {order.customer_last_name}
          </p>
          <p>
            <span className="text-slate-400">Email:</span> {order.customer_email}
          </p>
          <p>
            <span className="text-slate-400">Zip Code:</span> {order.customer_zip_code}
          </p>
          <p>
            <span className="text-slate-400">Shipping Address:</span>
          </p>
          <pre className="mt-2 whitespace-pre-wrap rounded-3xl bg-slate-950/50 p-3 text-sm text-slate-300">
            {order.shipping_address}
          </pre>
        </div>
      </div>

      <div className="glass-panel rounded-[28px] border border-orange-500/10 p-6 shadow-2xl shadow-orange-950/20">
        <h2 className="text-lg font-semibold text-slate-100">Order Items</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item, index) => (
            <li key={index} className="rounded-lg bg-slate-950/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-200">{item.name}</span>
                <span className="font-semibold text-orange-200">
                  €{(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Qty: {item.quantity} × €{item.unit_price.toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-panel rounded-[28px] border border-orange-500/10 p-6 shadow-2xl shadow-orange-950/20">
        <div className="rounded-3xl border border-orange-500/20 bg-slate-950/70 p-4 text-right">
          <p className="text-sm text-slate-400">Order Total</p>
          <p className="text-3xl font-bold text-orange-200">€{order.total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
