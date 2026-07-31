import { NextResponse } from "next/server";
import {
  getUpstreamUrl,
  buildSessionCookieAttributes,
  parseTenkeiSessionCookie,
  isRateLimited,
  hashIdentifierForLog,
  getClientIp,
} from "../_lib";

export async function POST(request: Request) {
  // 1. Env guard
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/login");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  // 2. Rate limit (defense in depth)
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a few minutes before trying again." },
      { status: 429 },
    );
  }

  // 3. Parse + validate input
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const rawIdentifier = body.identifier;
  const rawPassword = body.password;

  if (typeof rawIdentifier !== "string" || typeof rawPassword !== "string") {
    return NextResponse.json(
      { error: "identifier and password are required" },
      { status: 400 },
    );
  }

  const identifier = rawIdentifier.trim();
  const password = rawPassword; // Do NOT trim/sanitize password (special chars valid)

  // 4. Length caps (matches register route discipline)
  if (identifier.length > 100) {
    return NextResponse.json(
      { error: "Identifier is too long (max 100 characters)" },
      { status: 400 },
    );
  }

  if (password.length > 128) {
    return NextResponse.json(
      { error: "Password is too long (max 128 characters)" },
      { status: 400 },
    );
  }

  // 5. Build upstream request
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (process.env.CLOUDFLARE_BYPASS_SECRET) {
    headers.set("x-cf-bypass", process.env.CLOUDFLARE_BYPASS_SECRET);
  }
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("User-Agent", userAgent);
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) headers.set("Accept-Language", acceptLanguage);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let response: Response;
  try {
    response = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ identifier, password }),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeoutId);
    // Network error or timeout → generic 500
    return NextResponse.json(
      { error: "login failed" },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // 6. Read upstream response
  const responseText = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(responseText);
  } catch {
    // Non-JSON response
    data = {};
  }

  // 7. Success path: 2xx + status "ok" + Set-Cookie present
  const upstreamSetCookie = response.headers.get("set-cookie");
  const sessionValue = parseTenkeiSessionCookie(upstreamSetCookie);

  if (response.ok && data.status === "ok" && sessionValue) {
    const nextResponse = NextResponse.json({ status: "ok" }, { status: 200 });
    nextResponse.headers.set(
      "Set-Cookie",
      `tenkei_session=${sessionValue}; ${buildSessionCookieAttributes()}`,
    );
    return nextResponse;
  }

  // 8. Error normalization — never relay backend internals to the browser
  //    Never relay a Set-Cookie on non-ok paths (2FA defense).
  const clientIp = getClientIp(request);
  const identifierHash = await hashIdentifierForLog(identifier);
  const truncatedResponse =
    responseText.length > 1000
      ? `${responseText.slice(0, 1000)}... (truncated)`
      : responseText;

  console.error("Login failed:", {
    ip: clientIp,
    identifierHash,
    status: response.status,
    responseText: truncatedResponse,
  });

  // 5xx from backend → 500 to client (server error)
  if (response.status >= 500) {
    return NextResponse.json(
      { error: "login failed" },
      { status: 500 },
    );
  }

  // 4xx or 200-with-non-ok-body → 401 to client (credential failure)
  return NextResponse.json(
    { error: "invalid credentials" },
    { status: 401 },
  );
}
