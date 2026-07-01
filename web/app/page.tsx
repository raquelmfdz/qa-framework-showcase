import { db } from '../lib/db';
import ProductGrid from '../components/ProductGrid';
import Link from 'next/link';

const PAGE_SIZE = 6;

export default function HomePage({
  searchParams,
}: {
  searchParams?: { page?: string | string[]; category?: string | string[] };
}) {
  const pageParam = Array.isArray(searchParams?.page) ? searchParams.page[0] : searchParams?.page;
  const rawPage = parseInt(pageParam ?? '1', 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const category = Array.isArray(searchParams?.category)
    ? searchParams.category[0]
    : searchParams?.category || '';
  const offset = Math.max(0, (page - 1) * PAGE_SIZE);

  const categoryFilter = category ? 'WHERE category = ?' : '';
  const params = category ? [category, PAGE_SIZE, offset] : [PAGE_SIZE, offset];

  const products = db
    .prepare(
      `SELECT id, name, description, price, category, image_url FROM products ${categoryFilter} ORDER BY id LIMIT ? OFFSET ?`
    )
    .all(...params);

  const categories = db
    .prepare('SELECT DISTINCT category FROM products ORDER BY category')
    .all() as Array<{ category: string }>;
  const totalCount = (
    db
      .prepare(`SELECT COUNT(*) AS count FROM products ${categoryFilter}`)
      .get(...(category ? [category] : [])) as { count: number }
  ).count;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-10">
      <section className="glass-panel rounded-[32px] border border-orange-500/10 p-8 shadow-2xl shadow-orange-950/20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-orange-200/80">
              Featured storefront
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
              Welcome to the Demo Store
            </h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
              Browse hand-picked products, add items to your cart, and complete checkout in a fast,
              modern shopping flow.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200/80">
            Categories
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className={`rounded-full border border-white/10 px-4 py-2 text-sm transition ${category ? 'bg-white/10 text-orange-100' : 'bg-orange-500 text-slate-950'}`}
            >
              All
            </Link>
            {categories.map((item: any) => (
              <Link
                key={item.category}
                href={`/?category=${encodeURIComponent(item.category)}`}
                className={`rounded-full border border-white/10 px-4 py-2 text-sm transition ${category === item.category ? 'bg-orange-500 text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
              >
                {item.category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductGrid products={products} />

      <div className="rounded-3xl border border-orange-500/10 bg-slate-950/40 p-4 text-sm text-slate-300 shadow-2xl shadow-orange-950/10">
        Página {page} de {totalPages} · mostrando {PAGE_SIZE} productos por página.
      </div>

      <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? (
          <Link
            href={
              category
                ? `/?page=${page - 1}&category=${encodeURIComponent(category)}`
                : `/?page=${page - 1}`
            }
            className="rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-800"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-500">
            Previous
          </span>
        )}

        {Array.from({ length: totalPages }, (_, index) => {
          const pageIndex = index + 1;
          const href =
            pageIndex === 1
              ? category
                ? `/?category=${encodeURIComponent(category)}`
                : '/'
              : category
                ? `/?page=${pageIndex}&category=${encodeURIComponent(category)}`
                : `/?page=${pageIndex}`;
          const isActive = pageIndex === page;
          return (
            <Link
              key={pageIndex}
              href={href}
              className={`rounded px-3 py-2 text-sm ${isActive ? 'bg-orange-400 text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {pageIndex}
            </Link>
          );
        })}

        {page < totalPages ? (
          <Link
            href={
              category
                ? `/?page=${page + 1}&category=${encodeURIComponent(category)}`
                : `/?page=${page + 1}`
            }
            className="rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-800"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-full border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-500">
            Next
          </span>
        )}
      </nav>
    </div>
  );
}
