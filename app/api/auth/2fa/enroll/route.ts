import { NextResponse } from "next/server";
import {
  getUpstreamUrl,
  getSessionCookie,
  isRateLimited,
} from "../../_lib";

import { relayTotpResponse } from "../_lib";

/**
 * Starts TOTP enrollment. Returns the secret + otpauth_url exactly once;
 * 409 when 2FA is already enabled, 404 while the kill switch is off.
 */
export async function POST(request: Request) {
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/2fa/enroll");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  // Rate limit (defense in depth; the backend's limiter is authoritative)
  const rl = isRateLimited(request, "2fa-enroll");
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
