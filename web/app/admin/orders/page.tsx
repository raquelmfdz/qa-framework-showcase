'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Order {
  id: number;
  total: number;
  order_date: string;
  status: string;
  user_email: string;
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const response = await fetch('/api/orders?admin=true');
      if (!response.ok) {
        setError('Unable to load admin orders.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      setOrders(data);
      setLoading(false);
    }

    if (status === 'authenticated') {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">Loading…</div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Admin orders</h1>
        <p className="mt-2 text-slate-600">You need an administrator account to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Admin orders</h1>
        <p className="mt-2 text-sm text-slate-600">Review all orders placed by customers.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
          No orders found.
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-slate-900">Order #{order.id}</p>
              <p className="text-sm text-slate-600">Customer: {order.user_email}</p>
              <p className="text-sm text-slate-600">
                {new Date(order.order_date).toLocaleString()}
              </p>
              <p className="mt-2 text-slate-700">Total: €{order.total.toFixed(2)}</p>
              <p className="text-sm text-slate-600">Status: {order.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
