import { NextResponse } from "next/server";
import {
  buildSessionCookieAttributes,
  getUpstreamUrl,
  getSessionCookie,
  isRateLimited,
  parseTenkeiSessionCookie,
} from "../../_lib";

import { forwardTotpPost, isValidTotpCode, parseJsonObject } from "../_lib";

/**
 * TOTP login step 2 proxy. The pending session cookie (issued by the login
 * route on `2fa_required`) is the only credential accepted here; on success
 * the backend promotes it to a full session, whose new value we re-issue.
 */
export async function POST(request: Request) {
  // 1. Env guard
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/2fa/verify");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  // 2. Rate limit (defense in depth; the backend's limiter is authoritative)
  const rl = isRateLimited(request, "2fa-verify");
  if (rl.limited) {
    return NextResponse.json(
      {
        error: "Too many attempts. Please try again later.",
        retry_after_seconds: rl.retryAfterSeconds,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  // 3. Pending session required — same shape the backend would reject with
  if (!getSessionCookie(request)) {
    return NextResponse.json(
      { error: "session expired", code: "session_expired" },
      { status: 401 },
    );
  }

  // 4. Parse + format-check the code (real check is the backend's)
  const body = await parseJsonObject(request);
  const code = body ? body.code : undefined;
  if (!isValidTotpCode(code)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }

  // 5. Forward upstream
  let response: Response;
  try {
    response = await forwardTotpPost(request, upstreamUrl, { code });
  } catch {
    return NextResponse.json({ error: "service unavailable" }, { status: 500 });
  }

  const responseText = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(responseText);
  } catch {
    data = {};
  }

  // 6. Success: the backend promotes the pending session in place (same
  // cookie value — MarkVerified upgrades the existing session), so it sends
  // no Set-Cookie. The browser's pending cookie is already the verified
  // session. Re-issue only if the backend ever starts rotating the value.
  if (response.ok && data.status === "ok") {
    const nextResponse = NextResponse.json({ status: "ok" }, { status: 200 });
    const sessionValue = response.headers
      .getSetCookie()
      .map(parseTenkeiSessionCookie)
      .find((v): v is string => v !== null);
    if (sessionValue) {
      nextResponse.headers.set(
        "Set-Cookie",
        `tenkei_session=${sessionValue}; ${buildSessionCookieAttributes()}`,
      );
    }
    return nextResponse;
  }

  // 7. 401: pass the documented error strings through so the UI can
  // distinguish retry-from-step-2 from restart-login. `code` is the stable
  // machine identifier ("invalid_code" | "totp_locked" | "session_expired");
  // never relay cookies on failure paths.
  if (response.status === 401) {
    return NextResponse.json(
      {
        error: typeof data.error === "string" ? data.error : "invalid code",
        ...(typeof data.code === "string" ? { code: data.code } : {}),
      },
      { status: 401 },
    );
  }

  // 8. 404: TOTP kill switch off — relay the status so verify2FA's
  // `unavailable` branch works. Generic body; never relay the upstream
  // body or cookies.
  if (response.status === 404) {
    return NextResponse.json({ error: "service unavailable" }, { status: 404 });
  }

  // 9. Anything else → generic error
  return NextResponse.json({ error: "service unavailable" }, { status: 500 });
}
