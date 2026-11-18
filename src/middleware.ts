import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_COOKIE_NAME = 'prompt_auth_token';
const SUPER_ADMIN_ONLY_PATHS = ['/admins', '/settings'];
const PROTECTED_PATHS = [
  '/dashboard',
  '/prompts',
  '/categories',
  '/featured',
  '/trending',
  '/users',
  '/profile',
  '/client-apis',
  ...SUPER_ADMIN_ONLY_PATHS,
];

const DEFAULT_FALLBACK_SECRET = 'prompter-ai-admin-auth-secret-key-prod-2026-secure-32chars';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_FALLBACK_SECRET;

/**
 * Cryptographically verifies JWT HMAC-SHA256 signature using Edge Web Crypto API.
 */
async function verifyJwtEdge(
  token: string,
  secretStr: string
): Promise<{ id: string; email: string; role: string; exp?: number } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretStr);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    const binarySig = atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, dataToVerify);
    if (!isValid) return null;

    const jsonPayload = decodeURIComponent(
      atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // 1. Handle CORS for Public Client APIs (/api/v1)
  if (pathname.startsWith('/api/v1')) {
    // Handle OPTIONS Preflight
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-API-Key');
      response.headers.set('Access-Control-Max-Age', '86400');
      return response;
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-API-Key');
    return response;
  }

  // 2. Tighten CORS for Internal Admin APIs: Block Cross-Origin Tampering
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const host = request.headers.get('host');
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json({ error: 'Forbidden: Cross-origin request rejected on admin endpoint' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Forbidden: Malformed origin' }, { status: 403 });
      }
    }
  }

  // 3. Static files and public auth endpoints bypass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  const verified = token ? await verifyJwtEdge(token, JWT_SECRET) : null;

  const isAuthPage = pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password';
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
  const isSuperAdminPath = SUPER_ADMIN_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));

  // If already logged in and visiting auth page -> redirect to dashboard
  if (isAuthPage && verified) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Root redirect
  if (pathname === '/') {
    if (verified) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protected route check
  if (isProtectedPath && !verified) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based privilege enforcement: Admin cannot access Super Admin pages
  if (isSuperAdminPath && verified && verified.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
