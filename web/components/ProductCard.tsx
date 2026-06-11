'use client';

import { useEffect, useState } from 'react';

// Matches the Product interface in ProductGrid — keep these in sync
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

interface CartItem {
  product_id: number;
  quantity: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(0);
  const [inputValue, setInputValue] = useState('1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCartItem() {
      const response = await fetch('/api/cart');
      if (!response.ok) return;
      const items: CartItem[] = await response.json();
      const currentItem = items.find((item) => item.product_id === product.id);
      const currentQuantity = currentItem?.quantity ?? 0;
      setQuantity(currentQuantity);
      setInputValue(String(Math.max(1, currentQuantity)));
    }
    loadCartItem();
  }, [product.id]);

  async function syncQuantity(newQuantity: number) {
    setLoading(true);
    try {
      if (newQuantity <= 0) {
        await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: 0 }),
        });
      } else if (quantity === 0) {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: newQuantity }),
        });
      } else {
        await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, quantity: newQuantity }),
        });
      }
      setQuantity(newQuantity);
      setInputValue(String(Math.max(1, newQuantity)));
      window.dispatchEvent(new Event('cartUpdated'));
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    syncQuantity(quantity + 1);
  }
  function handleRemove() {
    syncQuantity(Math.max(0, quantity - 1));
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    if (/^\d*$/.test(nextValue)) setInputValue(nextValue);
  }

  function handleInputBlur() {
    const desired = Number(inputValue) || 1;
    if (desired !== quantity) {
      syncQuantity(desired);
    } else {
      setInputValue(String(Math.max(1, quantity)));
    }
  }

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="glass-panel overflow-hidden rounded-[28px] border border-orange-500/10 shadow-2xl shadow-orange-950/20"
    >
      <div className="relative overflow-hidden bg-slate-950">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src =
              'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80';
          }}
          className="h-64 w-full object-cover object-center transition duration-500 ease-in-out hover:scale-105"
        />
      </div>
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">{product.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{product.description}</p>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <span className="text-lg font-bold text-orange-200">€{product.price.toFixed(2)}</span>

          {quantity > 0 ? (
            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-2 py-1">
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                aria-label={`Decrease quantity for ${product.name}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-orange-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                −
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-16 rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-center text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                aria-label={`Quantity for ${product.name}`}
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={loading}
                aria-label={`Increase quantity for ${product.name}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-400 text-lg font-bold text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid={`add-to-cart-${product.id}`}
              aria-label={`Add ${product.name} to cart`}
              onClick={handleAdd}
              disabled={loading}
              className="rounded-full bg-orange-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
