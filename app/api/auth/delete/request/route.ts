import { NextResponse } from "next/server";
import { getUpstreamUrl, getSessionCookie, isRateLimited } from "../../_lib";

import { relayTotpResponse } from "../../2fa/_lib";

/**
 * Asks the backend to email a 6-digit account-deletion code (2FA-off users
 * only — the backend answers 400 when TOTP is enabled). Session required.
 */
export async function POST(request: Request) {
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/delete/request");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  // Rate limit (defense in depth; the backend's limiter is authoritative)
  const rl = isRateLimited(request, "auth-delete-request");
  if (rl.limited) {
    return NextResponse.json(
      {
        error: "Too many attempts. Please try again later.",
        retry_after_seconds: rl.retryAfterSeconds,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  if (!getSessionCookie(request)) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  return relayTotpResponse(request, upstreamUrl, {});
}
