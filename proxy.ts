import type { NextRequest } from "next/server";
import { i18nRouter } from "next-i18n-router";
import { i18n } from "./i18n.config";

export function proxy(request: NextRequest) {
  // Handle i18n routing
  const response = i18nRouter(request, i18n);

  // 1. Build the CSP
  // Allow unsafe-eval ONLY in development for Fast Refresh
  const isDev = process.env.NODE_ENV !== "production";
  const evalDirective = isDev ? "'unsafe-eval'" : "";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${evalDirective} https://challenges.cloudflare.com https://va.vercel-scripts.com;
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

  // 2. Attach the CSP to the response
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set(
    "x-middleware-request-content-security-policy",
    cspHeader,
  );

  return response;
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|favicon.ico).*)",
};
