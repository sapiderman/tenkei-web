import type { NextRequest } from "next/server";
import { i18nRouter } from "next-i18n-router";
import { i18n } from "./i18n.config";

export function proxy(request: NextRequest) {
  // 1. Generate a cryptographic nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // 2. Clone headers and set the nonce so Next.js components can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  request.headers.set("x-nonce", nonce);

  // Handle i18n routing
  const response = i18nRouter(request, i18n);

  // Ensure request headers are passed downstream if i18nRouter returns next() or rewrite()
  // Next.js requires 'x-middleware-request-x-nonce' to pass it to the application
  response.headers.set("x-middleware-request-x-nonce", nonce);

  // 3. Build the strict CSP
  // Allow unsafe-eval ONLY in development for Fast Refresh
  const isDev = process.env.NODE_ENV !== "production";
  const evalDirective = isDev ? "'unsafe-eval'" : "";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' ${evalDirective} https://challenges.cloudflare.com https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://asset.tenkeiaikidojo.org;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src https://challenges.cloudflare.com;
    connect-src 'self' https://challenges.cloudflare.com https://vitals.vercel-insights.com;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  // 4. Attach the CSP and the nonce to the response
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set(
    "x-middleware-request-content-security-policy",
    cspHeader,
  );
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|favicon.ico).*)",
};
