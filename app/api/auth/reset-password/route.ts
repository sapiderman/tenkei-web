import { NextResponse } from "next/server";
import { getUpstreamUrl, isRateLimited } from "../_lib";

/** Token states the backend reports; relayed verbatim for the UI. */
const TOKEN_ERROR_CODES = new Set([
  "invalid_token",
  "expired_token",
  "used_token",
]);

/**
 * BFF for POST /v1/auth/reset-password. No Turnstile here — the emailed
 * link is the proof of inbox control (PRD #24). Token-state errors are
 * relayed with their stable code so the UI can map all of them to a
 * "request a new link" state.
 */
export async function POST(request: Request) {
  // 1. Env guard
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/reset-password");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  // 2. Rate limit (defense in depth; the backend enforces 10/min per IP).
  const rl = isRateLimited(request, "reset");
  if (rl.limited) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
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

  const rawToken = body.token;
  if (typeof rawToken !== "string" || rawToken.trim() === "") {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }
  const token = rawToken.trim();
  // Valid tokens are 64 hex chars; the cap only guards abuse, never rejects
  // a legitimate value.
  if (token.length > 128) {
    return NextResponse.json(
      { error: "invalid password reset token", code: "invalid_token" },
      { status: 400 },
    );
  }

  const rawPassword = body.new_password;
  if (typeof rawPassword !== "string" || rawPassword === "") {
    return NextResponse.json(
      { error: "new_password is required" },
      { status: 400 },
    );
  }
  const newPassword = rawPassword; // Do NOT trim/sanitize passwords

  if (newPassword.length < 8 || newPassword.length > 72) {
    return NextResponse.json(
      { error: "Password must be between 8 and 72 characters" },
      { status: 400 },
    );
  }

  // 4. Forward upstream
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (process.env.CLOUDFLARE_BYPASS_SECRET) {
    headers.set("x-cf-bypass", process.env.CLOUDFLARE_BYPASS_SECRET);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let response: Response;
  try {
    response = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ token, new_password: newPassword }),
      signal: controller.signal,
    });
  } catch {
    return NextResponse.json(
      { error: "Password reset failed. Please try again." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // 5. Map the response. The upstream body is parsed for the token-state
  // code only — no internals are relayed beyond it.
  const responseText = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(responseText);
  } catch {
    data = {};
  }

  if (response.ok) {
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  if (response.status === 429) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retry_after_seconds: 60,
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  if (response.status >= 500) {
    return NextResponse.json(
      { error: "Password reset failed. Please try again." },
      { status: 500 },
    );
  }

  const code = typeof data.code === "string" ? data.code : "";
  if (code && TOKEN_ERROR_CODES.has(code)) {
    return NextResponse.json(
      { error: "invalid password reset token", code },
      { status: 400 },
    );
  }

  // Validation errors (e.g. password rule) — stable, safe to relay.
  const error = typeof data.error === "string" ? data.error : "invalid request";
  return NextResponse.json({ error }, { status: 400 });
}
