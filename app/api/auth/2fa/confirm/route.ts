import { NextResponse } from "next/server";
import {
  getUpstreamUrl,
  getSessionCookie,
  isRateLimited,
} from "../../_lib";

import {
  isValidPassword,
  isValidTotpCode,
  parseJsonObject,
  relayTotpResponse,
} from "../_lib";

/**
 * Finishes TOTP enrollment: first code from the authenticator + current
 * password. 403 wrong password, 400 invalid code, 409 no pending enrollment.
 */
export async function POST(request: Request) {
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/2fa/confirm");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  // Rate limit (defense in depth; the backend's limiter is authoritative)
  const rl = isRateLimited(request, "2fa-confirm");
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
  const currentPassword = body ? body.current_password : undefined;
  if (!isValidTotpCode(code) || !isValidPassword(currentPassword)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  return relayTotpResponse(request, upstreamUrl, {
    code,
    current_password: currentPassword,
  });
}
