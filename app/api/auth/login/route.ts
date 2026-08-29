import { NextResponse } from "next/server";
import {
  getUpstreamUrl,
  buildSessionCookieAttributes,
  parseTenkeiSessionCookie,
  isRateLimited,
  hashIdentifierForLog,
  getClientIp,
  isValidTurnstileToken,
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

  // 2. Rate limit (defense in depth). Cooldown is revealed to the caller —
  // safe: bucket is IP-keyed, so it says nothing about identifier validity.
  const rl = isRateLimited(request);
  if (rl.limited) {
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        retry_after_seconds: rl.retryAfterSeconds,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
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

  // Turnstile: format-check only — real verification is the backend's job
  // (same discipline as the register route).
  const rawTurnstileToken = body["cf_turnstile_response"];
  const turnstileToken =
    typeof rawTurnstileToken === "string" ? rawTurnstileToken.trim() : "";

  if (!turnstileToken) {
    return NextResponse.json(
      { error: "Security verification required" },
      { status: 400 },
    );
  }

  if (!isValidTurnstileToken(turnstileToken)) {
    return NextResponse.json(
      { error: "Invalid security verification token" },
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
      body: JSON.stringify({
        identifier,
        password,
        cf_turnstile_response: turnstileToken,
      }),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeoutId);
    // Network error or timeout → generic 500
    return NextResponse.json({ error: "login failed" }, { status: 500 });
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

  // 7. Success path: 2xx + status "ok" + Set-Cookie present.
  // getSetCookie() splits joined Set-Cookie headers (undici joins multiple
  // values with ", " — headers.get() would miss the session if the backend
  // ever sets a second cookie).
  const upstreamSetCookies = response.headers.getSetCookie();
  const sessionValue = upstreamSetCookies
    .map(parseTenkeiSessionCookie)
    .find((v): v is string => v !== null);

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
    return NextResponse.json({ error: "login failed" }, { status: 500 });
  }

  // Backend 429 → pass through as 429 so the UI can show a lockout message
  // instead of a misleading "invalid credentials". Same anti-enumeration
  // posture: a 429 is IP-keyed and leaks nothing about the identifier.
  if (response.status === 429) {
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        retry_after_seconds: 60,
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  // 4xx or 200-with-non-ok-body → 401 to client (credential failure)
  return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
}
