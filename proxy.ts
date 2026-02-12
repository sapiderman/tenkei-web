// proxy.ts
import { i18n } from "./i18n.config";
import { i18nRouter } from "next-i18n-router";
import { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  return i18nRouter(request, i18n);
}

// Define which paths the middleware should run on
export const config = {
  matcher: "/((?!api|static|.*\..*|_next|favicon.ico).*)", // Exclude API routes, static files, etc.
};
