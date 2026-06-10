'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    async function fetchCount() {
      const response = await fetch('/api/cart');
      const items = await response.json();
      setCount(items.reduce((sum: number, item: any) => sum + item.quantity, 0));
    }

    fetchCount();
    window.addEventListener('cartUpdated', fetchCount);
    return () => window.removeEventListener('cartUpdated', fetchCount);
  }, []);

  return (
    <header className="glass-panel sticky top-0 z-30 border-b border-slate-700/60">
      <nav
        className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6"
        aria-label="Main Navigation"
      >
        <div>
          <Link href="/" className="text-xl font-semibold tracking-wide text-orange-200">
            Demo Store
          </Link>
        </div>
        <ul className="flex flex-wrap items-center gap-3">
          {session?.user ? (
            <li>
              <Link
                href="/orders"
                data-testid="nav-my-orders"
                className="text-slate-700 hover:text-slate-900"
              >
                My Orders
              </Link>
            </li>
          ) : null}
          <li>
            <Link
              href="/cart"
              data-testid="nav-cart-icon"
              aria-label={`Cart, ${count} items`}
              className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-100 transition hover:bg-orange-500/20"
            >
              Cart ({count})
            </Link>
          </li>
          <li>
            <button
              data-testid="nav-login"
              onClick={() => signIn('credentials')}
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
              type="button"
            >
              Login
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
