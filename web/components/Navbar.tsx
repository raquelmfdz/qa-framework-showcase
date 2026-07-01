'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [count, setCount] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCount() {
      const response = await fetch('/api/cart');
      const items = (await response.json()) as Array<{ quantity: number }>;
      setCount(items.reduce((sum, item) => sum + item.quantity, 0));
    }
    fetchCount();
    window.addEventListener('cartUpdated', fetchCount);
    return () => window.removeEventListener('cartUpdated', fetchCount);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut({ redirect: false });
    router.push('/login');
  };

  const isAdmin = session?.user?.role === 'ADMIN';

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
          {/* Orders link — only when logged in */}
          {session?.user && (
            <li>
              <Link
                href={isAdmin ? '/admin/orders' : '/orders'}
                data-testid="nav-my-orders"
                className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-100 transition hover:bg-orange-500/20"
              >
                {isAdmin ? 'View Client Orders' : 'My Orders'}
              </Link>
            </li>
          )}

          {/* Cart */}
          <li>
            <Link
              href="/cart"
              data-testid="nav-cart-icon"
              aria-label={`Cart, ${count} items`}
              className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-100 transition hover:bg-orange-500/20"
            >
              <span data-testid="cart-item-count">Cart ({count})</span>
            </Link>
          </li>

          {/* Login button OR user dropdown */}
          <li>
            {session?.user ? (
              <div className="relative" ref={menuRef}>
                <button
                  data-testid="nav-user-menu"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                >
                  <span data-testid="navbar-user-name">
                    {session.user.name ?? session.user.email}
                  </span>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900 py-1 shadow-lg"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push('/profile');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-orange-100 hover:bg-slate-800"
                    >
                      Edit Profile
                    </button>
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-orange-100 hover:bg-slate-800"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                data-testid="nav-login"
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
              >
                Login
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
