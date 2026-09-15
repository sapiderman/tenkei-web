import { NextResponse } from "next/server";
import { getUpstreamUrl, getSessionCookie } from "../_lib";

/**
 * Shared plumbing for the TOTP 2FA proxy routes (app/api/auth/2fa/*).
 * Format-checks only — the backend owns all real validation, rate limits,
 * and the session/promotion state machine.
 */

/** TOTP codes are exactly 6 digits. */
export function isValidTotpCode(code: unknown): code is string {
  return typeof code === "string" && /^\d{6}$/.test(code);
}

/** Passwords: non-empty string, capped like the login route (backend re-validates). */
export function isValidPassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length > 0 &&
    password.length <= 128
  );
}

/**
 * Forwards an authenticated JSON POST to a /v1/auth/2fa/* path with the
 * session cookie and bypass header. Returns the raw upstream Response.
 */
export async function forwardTotpPost(
  request: Request,
  upstreamPath: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  const session = getSessionCookie(request);
  if (session) headers.set("Cookie", `tenkei_session=${session}`);
  if (process.env.CLOUDFLARE_BYPASS_SECRET) {
    headers.set("x-cf-bypass", process.env.CLOUDFLARE_BYPASS_SECRET);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(getUpstreamUrl(upstreamPath), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

const RELAYED_STATUSES = new Set([200, 400, 401, 403, 404, 409]);

/**
 * Forwards the request and relays the backend's response: 2xx bodies pass
 * through verbatim (enroll's secret/otpauth_url must reach the client), the
 * documented 4xx error bodies pass through (the UI maps them by status code),
 * everything else becomes a generic 500 — backend internals never leak.
 */
export async function relayTotpResponse(
  request: Request,
  upstreamPath: string,
  body: Record<string, unknown>,
): Promise<NextResponse> {
  let response: Response;
  try {
    response = await forwardTotpPost(request, upstreamPath, body);
  } catch {
    console.error("2FA proxy upstream error:", { path: upstreamPath });
    return NextResponse.json({ error: "service unavailable" }, { status: 500 });
  }

  const responseText = await response.text();

  if (RELAYED_STATUSES.has(response.status)) {
    return new NextResponse(responseText || "{}", {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const truncated =
    responseText.length > 1000
      ? `${responseText.slice(0, 1000)}... (truncated)`
      : responseText;
  console.error("2FA proxy unexpected upstream status:", {
    path: upstreamPath,
    status: response.status,
    responseText: truncated,
  });
  return NextResponse.json({ error: "service unavailable" }, { status: 500 });
}

/** Parses the request body as a JSON object, or null. */
export async function parseJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
