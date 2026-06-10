'use client';

import { useEffect, useState } from 'react';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: number;
  image_url: string;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadCart() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/cart');
      if (!response.ok) throw new Error('Unable to load cart');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError('Unable to load your cart. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  async function updateQuantity(productId: number, quantity: number) {
    const response = await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
    });
    if (response.ok) {
      loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }

  async function removeItem(productId: number) {
    const response = await fetch('/api/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    if (response.ok) {
      loadCart();
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[28px] border border-orange-500/10 p-6 shadow-2xl shadow-orange-950/20">
        <h1 className="text-3xl font-semibold text-slate-100">Shopping cart</h1>
        <p className="mt-2 text-sm text-slate-300">
          Review items and edit quantities before completing checkout.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
          Loading cart…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-[28px] border border-orange-500/10 bg-slate-950/40 p-6 shadow-2xl shadow-orange-950/20 text-slate-300">
          Your cart is empty.
        </div>
      ) : (
        <div className="rounded-[28px] border border-orange-500/10 bg-slate-950/40 p-6 shadow-2xl shadow-orange-950/20">
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                data-testid={`cart-item-${item.product_id}`}
                className="glass-panel rounded-[24px] border border-orange-500/10 p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-20 w-20 rounded-3xl object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-100">{item.name}</p>
                      <p className="text-sm text-slate-300">€{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm text-slate-300">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) =>
                        updateQuantity(item.product_id, Number(event.target.value))
                      }
                      className="w-20 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      data-testid={`cart-quantity-${item.product_id}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="rounded-full bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                      data-testid={`cart-remove-${item.product_id}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-3xl border border-orange-500/10 bg-slate-950/70 p-5 text-right">
            <p className="text-sm text-slate-400">Order total</p>
            <p className="text-3xl font-semibold text-orange-200" data-testid="cart-total">
              €{total.toFixed(2)}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/checkout"
              className="rounded-full bg-orange-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-300"
              data-testid="cart-checkout"
            >
              Proceed to checkout
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
