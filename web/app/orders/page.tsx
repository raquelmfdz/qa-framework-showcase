'use client';

import { useEffect, useState } from 'react';

interface Order {
  id: number;
  total: number;
  order_date: string;
  status: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const response = await fetch('/api/orders');
      if (!response.ok) {
        setError('Unable to load orders.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      setOrders(data);
      setLoading(false);
    }

    loadOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[28px] border border-orange-500/10 p-6 shadow-2xl shadow-orange-950/20">
        <h1 className="text-3xl font-semibold text-slate-100">My orders</h1>
        <p className="mt-2 text-sm text-slate-300">Review your order history and order details.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel rounded-[28px] border border-orange-500/10 p-6 text-slate-300">
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
