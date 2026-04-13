import type { NextRequest } from "next/server";
import { i18nRouter } from "next-i18n-router";
import { i18n } from "./i18n.config";

export function proxy(request: NextRequest) {
  // 1. Generate a cryptographic nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // 2. Build the strict CSP
  // Allow unsafe-eval ONLY in development for Fast Refresh
  const isDev = process.env.NODE_ENV !== "production";
  const evalDirective = isDev ? "'unsafe-eval'" : "";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'unsafe-inline' ${evalDirective} https://challenges.cloudflare.com https://va.vercel-scripts.com;
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

  // 3. Set headers on the incoming request so Next.js reads the CSP and nonce to inject into <script> tags
  request.headers.set("x-nonce", nonce);
  request.headers.set("content-security-policy", cspHeader);

  // 4. Handle i18n routing
  // i18nRouter automatically propagates the mutated request.headers down to Next.js
  const response = i18nRouter(request, i18n);

  // 5. Attach the CSP and the nonce to the final response for the browser
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|favicon.ico).*)",
};
