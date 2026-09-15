import { NextResponse } from "next/server";
import { getUpstreamUrl, getSessionCookie } from "../../_lib";

import {
  isValidPassword,
  isValidTotpCode,
  parseJsonObject,
  relayTotpResponse,
} from "../_lib";

/**
 * Turns TOTP off: current code + current password required together.
 * 403 wrong password, 400 invalid code / not enabled.
 */
export async function POST(request: Request) {
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/2fa/disable");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
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
