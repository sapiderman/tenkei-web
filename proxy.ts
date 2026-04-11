import type { NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import { i18n } from './i18n.config';

export function proxy(request: NextRequest) {
  // Handle i18n routing first — may return a redirect or rewrite for locale resolution.
  // Must run before CSP so locale redirects are not blocked.
  const response = i18nRouter(request, i18n);

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Strict CSP:
  // 'strict-dynamic' allows scripts loaded by nonced scripts to execute.
  // Cloudflare Turnstile domain kept explicitly for safety.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com;
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' data: https://asset.tenkeiaikidojo.org;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src https://challenges.cloudflare.com;
    connect-src 'self' https://challenges.cloudflare.com;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // Attach CSP and nonce to whatever response i18nRouter produced (redirect or next).
  response.headers.set('x-nonce', nonce);
  response.headers.set('Content-Security-Policy', cspHeader);

  // Forward x-nonce as a request header so server components can read it via headers().
  response.headers.set('x-middleware-request-x-nonce', nonce);

  return response;
}

export const config = {
  // Exclude API routes, static assets, and Next.js internals.
  // No `missing: prefetch` clause — i18nRouter must run on prefetch requests
  // so that client-side <Link> navigation correctly resolves localised routes.
  matcher: '/((?!api|static|.*\\..*|_next|favicon.ico).*)',
};
