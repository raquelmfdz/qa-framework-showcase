'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface CartItem {
  product_id: number;
  quantity: number;
  name: string;
  price: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadCart() {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    }
    loadCart();
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
      const [name, surname] = (session.user.name || '').split(' ');
      if (name) setFirstName(name);
      if (surname) setLastName(surname);
    }
  }, [session]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !zipCode.trim() ||
      !address.trim()
    ) {
      setMessage('All fields are required.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: firstName,
        customerLastName: lastName,
        customerEmail: email,
        customerZipCode: zipCode,
        shippingAddress: address,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      setMessage(error || 'Unable to complete checkout.');
      setSubmitting(false);
      return;
    }

    const order = await response.json();
    router.push(`/order/success/${order.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[28px] border border-orange-500/10 p-6 shadow-2xl shadow-orange-950/20">
        <h1 className="text-3xl font-semibold text-slate-100">Checkout</h1>
        <p className="mt-2 text-sm text-slate-300">Confirm your details and place your order.</p>
      </div>

      <div className="glass-panel rounded-[28px] border border-orange-500/10 p-6 shadow-2xl shadow-orange-950/20">
        <h2 className="text-lg font-semibold text-slate-100">Order summary</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-slate-300">Your cart is empty.</p>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li
                  key={item.product_id}
                  className="flex items-center justify-between rounded-lg bg-slate-950/40 p-3"
                >
                  <span className="text-slate-200">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-orange-200 font-semibold">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-3xl border border-orange-500/10 bg-slate-950/70 p-4 text-right">
              <p className="text-sm text-slate-400">Order total</p>
              <p className="text-2xl font-semibold text-orange-200">€{total.toFixed(2)}</p>
            </div>
          </>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-[28px] border border-orange-500/10 bg-slate-950/80 p-6 shadow-2xl shadow-orange-950/20 space-y-4"
      >
        <h2 className="text-lg font-semibold text-slate-100">Shipping Information</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-100">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
              data-testid="checkout-first-name"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-100">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
              data-testid="checkout-last-name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-100">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
            data-testid="checkout-email"
          />
        </div>

        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-slate-100">
            Zip code
          </label>
          <input
            id="zipCode"
            type="text"
            value={zipCode}
            onChange={(event) => setZipCode(event.target.value)}
            className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
            data-testid="checkout-zip-code"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-100">
            Shipping address
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
            data-testid="checkout-address"
          />
        </div>

        {message ? (
          <p className="text-sm text-orange-200" data-testid="checkout-error">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="w-full rounded-full bg-orange-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:bg-orange-600"
          data-testid="checkout-submit"
        >
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </div>
  );
}
