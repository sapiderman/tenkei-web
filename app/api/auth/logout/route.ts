import { NextResponse } from "next/server";
import {
  getUpstreamUrl,
  clearSessionCookieHeader,
} from "../_lib";

export async function POST(request: Request) {
  // 1. Env guard
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/logout");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    // Still clear the browser cookie even if env is misconfigured
    const res = NextResponse.json({ status: "ok" }, { status: 200 });
    res.headers.set("Set-Cookie", clearSessionCookieHeader());
    return res;
  }

  // 2. Read session cookie — forward to backend if present
  const cookieHeader = request.headers.get("cookie") || "";
  const match = /(?:^|;\s*)tenkei_session=([^;]+)/.exec(cookieHeader);
  const sessionValue = match?.[1];

  if (sessionValue) {
    // Best-effort: try to invalidate the session on the backend
    try {
      const headers = new Headers();
      headers.set("Cookie", `tenkei_session=${sessionValue}`);
      if (process.env.CLOUDFLARE_BYPASS_SECRET) {
        headers.set("x-cf-bypass", process.env.CLOUDFLARE_BYPASS_SECRET);
      }
      const userAgent = request.headers.get("user-agent");
      if (userAgent) headers.set("User-Agent", userAgent);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000);

      try {
        await fetch(upstreamUrl, {
          method: "POST",
          headers,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    } catch {
      // Backend unreachable — log but don't fail the logout.
      // The user's goal is to clear their local session.
      console.warn("Logout: backend unreachable, clearing cookie anyway");
    }
  }

  // 3. Always clear the browser cookie regardless of backend outcome
  const res = NextResponse.json({ status: "ok" }, { status: 200 });
  res.headers.set("Set-Cookie", clearSessionCookieHeader());
  return res;
}
