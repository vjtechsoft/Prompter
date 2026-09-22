import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_COOKIE_NAME = 'prompt_auth_token';
const SUPER_ADMIN_ONLY_PATHS = ['/admins', '/settings'];
const PROTECTED_PATHS = ['/dashboard', '/prompts', '/categories', '/featured', '/users', '/profile', '/client-apis', ...SUPER_ADMIN_ONLY_PATHS];

function parseJwt(token: string): { id: string; email: string; role: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null; // Expired
    }
    return parsed;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and public API bypass (including public client APIs in /api/v1)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/v1') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  const verified = token ? parseJwt(token) : null;

  const isAuthPage = pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password';
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
  const isSuperAdminPath = SUPER_ADMIN_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));

  // If already logged in and visiting login/auth page -> redirect to dashboard
  if (isAuthPage && verified) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If visiting root / -> redirect to dashboard or login
  if (pathname === '/') {
    if (verified) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If visiting protected path without auth -> redirect to login
  if (isProtectedPath && !verified) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If regular Admin visits Super Admin only path -> redirect to dashboard
  if (isSuperAdminPath && verified && verified.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
