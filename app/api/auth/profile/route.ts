import { NextResponse } from "next/server";
import { getUpstreamUrl, getClientIp } from "../_lib";

export async function GET(request: Request) {
  // 1. Env guard
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl("/v1/auth/profile");
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  // 2. Read session cookie from browser request
  const cookieHeader = request.headers.get("cookie") || "";
  const match = /(?:^|;\s*)tenkei_session=([^;]+)/.exec(cookieHeader);
  const sessionValue = match?.[1];

  if (!sessionValue) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  // 3. Forward to backend
  const headers = new Headers();
  headers.set("Cookie", `tenkei_session=${sessionValue}`);
  if (process.env.CLOUDFLARE_BYPASS_SECRET) {
    headers.set("x-cf-bypass", process.env.CLOUDFLARE_BYPASS_SECRET);
  }
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("User-Agent", userAgent);
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) headers.set("Accept-Language", acceptLanguage);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let response: Response;
  try {
    response = await fetch(upstreamUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ error: "profile_unavailable" }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }

  // 4. 2xx: pass through unchanged
  if (response.ok) {
    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. 401: pass through unchanged (client handles redirect)
  if (response.status === 401) {
    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 6. 5xx or other errors: generic error, raw body not forwarded
  const clientIp = getClientIp(request);
  const responseText = await response.text();
  const truncated =
    responseText.length > 1000
      ? `${responseText.slice(0, 1000)}... (truncated)`
      : responseText;

  console.error("Profile upstream error:", {
    ip: clientIp,
    status: response.status,
    responseText: truncated,
  });

  return NextResponse.json({ error: "profile_unavailable" }, { status: 500 });
}
