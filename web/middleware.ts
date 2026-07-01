import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/profile')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', `/profile${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/admin/orders')) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', `/admin/orders${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (String(token.role ?? '').toUpperCase() !== 'ADMIN') {
      return NextResponse.redirect(new URL('/orders', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/admin/orders/:path*'],
};
