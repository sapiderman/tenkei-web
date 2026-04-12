import type { NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
import { i18n } from './i18n.config';

export function proxy(request: NextRequest) {
  // Handle i18n routing first — may return a redirect or rewrite for locale resolution.
  // Must run before CSP so locale redirects are not blocked.
  const response = i18nRouter(request, i18n);

  // CSP without nonce/strict-dynamic — Next.js static scripts have no nonce attribute
  // so strict-dynamic would block hydration. 'self' is sufficient for this site.
  const cspHeader = `
    default-src 'self';
    script-src 'self' https://challenges.cloudflare.com;
    style-src 'self';
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

  // Attach CSP to whatever response i18nRouter produced (redirect or next).
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  // Exclude API routes, static assets, and Next.js internals.
  // No `missing: prefetch` clause — i18nRouter must run on prefetch requests
  // so that client-side <Link> navigation correctly resolves localised routes.
  matcher: '/((?!api|static|.*\\..*|_next|favicon.ico).*)',
};
