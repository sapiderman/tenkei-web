import type { NextRequest } from "next/server";
import { i18nRouter } from "next-i18n-router";
import { i18n } from "./i18n.config";

export function proxy(request: NextRequest) {
  // Handle i18n routing
  const response = i18nRouter(request, i18n);

  // 1. Build the CSP
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = [
    "'self'",
    "https://challenges.cloudflare.com",
    "https://va.vercel-scripts.com",
  ];
  if (isDev) {
    scriptSrc.unshift("'unsafe-eval'");
  }

  const cspDirectives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")} 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://asset.tenkeiaikidojo.org",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src https://challenges.cloudflare.com",
    "connect-src 'self' https://challenges.cloudflare.com https://vitals.vercel-insights.com",
    "upgrade-insecure-requests",
  ];

  const cspHeader = cspDirectives.join("; ");
  const permissionsPolicy =
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()";

  // 2. Attach the CSP to the response
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("Permissions-Policy", permissionsPolicy);
  response.headers.set(
    "x-middleware-request-content-security-policy",
    cspHeader,
  );

  return response;
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|favicon.ico).*)",
};
