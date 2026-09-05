import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { i18nRouter } from "next-i18n-router";
import { i18n } from "./i18n.config";

/** Page paths (locale prefix stripped) that get the strict nonce CSP. */
const PORTAL_PATHS = /^\/(login|register|profile|admin)(\/|$)/;

function securityHeaders(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()",
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("x-tenkei-proxy", "active");
  return response;
}

function cspDirectives(inlinePolicy: string): string {
  const scriptSrc = [
    "'self'",
    "https://challenges.cloudflare.com",
    "https://va.vercel-scripts.com",
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")} ${inlinePolicy}`,
    `script-src-elem ${scriptSrc.join(" ")} ${inlinePolicy}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://asset.tenkeiaikidojo.org https://www.tenkeiaikidojo.org",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com",
    "connect-src 'self' https://challenges.cloudflare.com https://*.cloudflare.com https://vitals.vercel-insights.com",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/");
  const hasLocale =
    segments[1] !== undefined &&
    (i18n.locales as string[]).includes(segments[1]);
  const rest = "/" + segments.slice(hasLocale ? 2 : 1).join("/");

  // Portal pages get a strict nonce CSP — no 'unsafe-inline'. Nonce CSP
  // requires dynamically rendered pages (every portal page is force-dynamic);
  // marketing pages are statically prerendered, so a per-request nonce there
  // would go stale in the cached HTML and break hydration — they keep the
  // legacy policy below. Locale-less portal paths (/login) fall through to
  // i18nRouter and re-enter this branch after the redirect.
  if (hasLocale && PORTAL_PATHS.test(rest)) {
    const isDev = process.env.NODE_ENV !== "production";
    const nonce = btoa(crypto.randomUUID());
    const inlinePolicy = `'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`;
    const csp = cspDirectives(inlinePolicy);

    // Setting the CSP on the request headers is the documented Next.js
    // pattern: the renderer reads it and applies the nonce to its own inline
    // bootstrap scripts automatically.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    securityHeaders(response, csp);
    // A cached copy would carry a stale nonce — never cache portal HTML.
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const inlinePolicy =
    process.env.NODE_ENV !== "production"
      ? "'unsafe-eval' 'unsafe-inline'"
      : "'unsafe-inline'";
  const response = i18nRouter(request, i18n);
  return securityHeaders(response, cspDirectives(inlinePolicy));
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|favicon.ico).*)",
};
