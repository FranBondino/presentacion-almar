/**
 * ALMAR Rosario Logistics & Freight Forwarding Portal
 * Next.js Edge Middleware for Corporate Zero-Trust Access Control
 * 
 * Enforces cryptographic HMAC-SHA256 verification and expiration checks via Web Crypto API.
 * Unauthenticated requests are immediately redirected to /login with HTTP 307 (pages)
 * or rejected with HTTP 401 (API routes).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login
     * - /api/auth/login
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico
     * - /images/* (public branding assets)
     * - /output.css (compiled stylesheet)
     * - /api/ingestion/* (webhook endpoints protected by token/header authentication)
     */
    '/((?!login|api/auth/login|_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|icons/|images/|output.css|api/ingestion).*)',
  ],
};

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64.padEnd(base64.length + padLen, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface TokenVerificationResult {
  valid: boolean;
  expired?: boolean;
  payload?: {
    sub?: string;
    id?: string;
    email?: string;
    role?: string;
    exp?: number;
    [key: string]: unknown;
  };
  error?: string;
}

export async function verifyCorporateTokenEdge(
  token: string,
  secret: string
): Promise<TokenVerificationResult> {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'TOKEN_MISSING' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'MALFORMED_JWT' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64 || !signatureB64) {
    return { valid: false, error: 'MISSING_SEGMENTS' };
  }

  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);

    const subtle = (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle)
      ? globalThis.crypto.subtle
      : (typeof crypto !== 'undefined' ? crypto.subtle : null);

    if (!subtle) {
      throw new Error('Web Crypto API (crypto.subtle) no disponible en este entorno');
    }

    // Import symmetric HMAC-SHA256 key
    const cryptoKey = await subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const dataToVerify = enc.encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlToUint8Array(signatureB64);

    // Constant-time HMAC-SHA256 signature verification
    const isValidSig = await subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes as unknown as BufferSource,
      dataToVerify as unknown as BufferSource
    );

    if (!isValidSig) {
      return { valid: false, error: 'INVALID_SIGNATURE' };
    }

    // Decode and parse payload
    const payloadBytes = base64UrlToUint8Array(payloadB64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson);

    // Enforce timestamp / expiration window
    if (typeof payload.exp !== 'number') {
      return { valid: false, error: 'MISSING_EXP' };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds >= payload.exp) {
      return { valid: false, expired: true, error: 'TOKEN_EXPIRED' };
    }

    return { valid: true, payload };
  } catch (err) {
    return {
      valid: false,
      error: `VERIFICATION_FAILED: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function extractRawToken(val: string | undefined): string | null {
  if (!val) return null;
  let raw = val;
  if (raw.startsWith('base64-')) {
    try {
      const b64 = raw.slice(7).replace(/-/g, '+').replace(/_/g, '/');
      const padLen = (4 - (b64.length % 4)) % 4;
      const padded = b64.padEnd(b64.length + padLen, '=');
      raw = atob(padded);
    } catch {
      // ignore
    }
  }
  if (raw.startsWith('[') || raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        raw = parsed[0];
      } else if (parsed && typeof parsed === 'object') {
        raw = parsed.access_token || parsed.token || '';
      }
    } catch {
      // ignore
    }
  }
  return typeof raw === 'string' && raw.includes('.') ? raw : null;
}

function rejectUnauthenticated(request: NextRequest, pathname: string, reason?: string) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        success: false,
        error: reason ? `Acceso no autorizado: ${reason}` : 'Acceso no autorizado. Inicie sesión para continuar.',
        code: 'UNAUTHENTICATED',
      },
      { status: 401 }
    );
  }

  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/') {
    loginUrl.searchParams.set('returnUrl', pathname);
  }
  return NextResponse.redirect(loginUrl, 307);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Allow public access to strictly public paths
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname === '/output.css' ||
    pathname.startsWith('/api/ingestion')
  ) {
    return NextResponse.next();
  }

  // Retrieve auth token candidate from cookies
  const almarAuthCookie = request.cookies.get('almar_auth')?.value;
  const sbAccessTokenCookie = request.cookies.get('sb-access-token')?.value;

  let sbAuthTokenVal: string | undefined;
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith('sb-') && c.name.includes('auth-token')) {
      sbAuthTokenVal = c.value;
      break;
    }
  }

  const tokenCandidate =
    extractRawToken(almarAuthCookie) ||
    extractRawToken(sbAccessTokenCookie) ||
    extractRawToken(sbAuthTokenVal);

  if (!tokenCandidate) {
    return rejectUnauthenticated(request, pathname, 'Token no presente');
  }

  const secret = process.env.AUTH_SECRET || 'almar-secure-corporate-signature';
  const verification = await verifyCorporateTokenEdge(tokenCandidate, secret);

  if (!verification.valid) {
    return rejectUnauthenticated(request, pathname, verification.error);
  }

  return NextResponse.next();
}
