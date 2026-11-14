import { NextResponse } from "next/server";
import { getUpstreamUrl, getSessionCookie, isRateLimited } from "../_lib";

import {
  isValidTotpCode,
  parseJsonObject,
  relayTotpResponse,
} from "../2fa/_lib";

/**
 * Deletes the account after possession-based verification: the 6-digit code
 * is a TOTP code when 2FA is on, an emailed one-time code when off (the
 * backend decides which). 400 invalid code, 401 no session.
 */
export async function POST(request: Request) {
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/delete");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  // Rate limit (defense in depth; the backend's limiter is authoritative)
  const rl = isRateLimited(request, "auth-delete");
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

  const body = await parseJsonObject(request);
  const code = body ? body.code : undefined;
  if (!isValidTotpCode(code)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  return relayTotpResponse(request, upstreamUrl, { code });
}
