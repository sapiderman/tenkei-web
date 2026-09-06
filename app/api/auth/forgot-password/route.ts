import { NextResponse } from "next/server";
import { getUpstreamUrl, isRateLimited, isValidTurnstileToken } from "../_lib";

/**
 * BFF for POST /v1/auth/forgot-password. Mirrors the login route's
 * discipline: format-check Turnstile locally, real verification upstream,
 * normalized errors downstream. The anti-enumeration posture (generic
 * response for known and unknown emails alike) is enforced by the backend;
 * this route only relays it.
 */
export async function POST(request: Request) {
  // 1. Env guard
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/forgot-password");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  // 2. Rate limit (defense in depth; the backend enforces 5/min per IP).
  const rl = isRateLimited(request, "forgot");
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

  const rawEmail = body.email;
  if (typeof rawEmail !== "string" || rawEmail.trim() === "") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  const email = rawEmail.trim();
  if (email.length > 255) {
    return NextResponse.json(
      { error: "Email is too long (max 255 characters)" },
      { status: 400 },
    );
  }

  // Turnstile: format-check only — real verification is the backend's job.
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
      body: JSON.stringify({ email, cf_turnstile_response: turnstileToken }),
      signal: controller.signal,
    });
  } catch {
    return NextResponse.json(
      { error: "Request failed. Please try again later." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // 5. Relay the generic 200. Never relay upstream internals.
  if (response.ok) {
    return NextResponse.json(
      {
        status: "ok",
        message:
          "If an account exists for this email, a password reset link has been sent.",
      },
      { status: 200 },
    );
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
      { error: "Request failed. Please try again later." },
      { status: 500 },
    );
  }

  // Upstream 4xx (Turnstile rejection) → 400 with a stable message.
  return NextResponse.json(
    {
      error: "Security verification failed. Please try again in a few minutes.",
    },
    { status: 400 },
  );
}
