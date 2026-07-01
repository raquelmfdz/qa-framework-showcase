'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface AdminOrder {
  id: number;
  customer_name: string;
  customer_last_name: string;
  customer_email: string;
  status: string;
  total: number;
  created_at: string;
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        setError('Unable to load orders.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      setOrders(data);
      setLoading(false);
    }

    if (status === 'authenticated') loadOrders();
    else setLoading(false);
  }, [status]);

  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'ADMIN';

  if (status === 'loading') {
    return <div className="glass-panel rounded-xl p-6 text-orange-100">Loading…</div>;
  }

  if (status === 'unauthenticated' || !isAdmin) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <h1 className="text-2xl font-bold text-orange-200">Access Denied</h1>
        <p className="mt-2 text-slate-400">You need an administrator account to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-6">
        <h1 className="text-2xl font-bold text-orange-200">Client Orders</h1>
        <p className="mt-1 text-sm text-slate-400">All orders placed by customers.</p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-xl p-6 text-orange-100">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="glass-panel rounded-xl p-6 text-slate-400">No orders found.</div>
      ) : (
        <div
          data-testid="admin-orders-table"
          className="overflow-hidden rounded-xl border border-slate-700/60"
        >
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700/60 bg-slate-900/60">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-orange-200">Order</th>
                <th className="px-4 py-3 text-left font-semibold text-orange-200">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-orange-200">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-orange-200">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-orange-200">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-orange-200">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr
                  key={order.id}
                  data-testid="admin-order-row"
                  className={i % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/10'}
                >
                  <td className="px-4 py-3 text-orange-100">#{order.id}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {order.customer_name} {order.customer_last_name}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{order.customer_email}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-300">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-orange-100">
                    €{order.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
