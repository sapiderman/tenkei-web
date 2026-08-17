import { NextResponse } from "next/server";
import { getUpstreamUrl, getClientIp } from "../auth/_lib";

interface ForwardOptions {
  /** Full backend path including query, e.g. "/v1/admin/users?size=25". */
  path: string;
  /** The browser request (cookie source; body source for PUT/POST). */
  request: Request;
  method?: "GET" | "PUT" | "POST";
  /** Generic error key returned on 5xx/network (default "admin_request_failed"). */
  errorKey?: string;
}

/**
 * Forwards an authenticated admin request to the backend: forwards the
 * tenkei_session cookie + x-cf-bypass header (and body for PUT/POST), and
 * passes 2xx + 4xx through verbatim — the client needs 400/403/404/409 bodies
 * to render inline messages. 5xx and network errors are masked to a generic 500.
 *
 * Session-gated, not IP-rate-limited — same posture as the profile proxy.
 */
export async function forwardAuthed({
  path,
  request,
  method = "GET",
  errorKey = "admin_request_failed",
}: ForwardOptions): Promise<NextResponse> {
  let upstreamUrl: string;
  try {
    upstreamUrl = getUpstreamUrl(path);
  } catch {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = /(?:^|;\s*)tenkei_session=([^;]+)/.exec(cookieHeader);
  const sessionValue = match?.[1];
  if (!sessionValue) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const headers = new Headers();
  headers.set("Cookie", `tenkei_session=${sessionValue}`);
  if (method !== "GET") headers.set("Content-Type", "application/json");
  if (process.env.CLOUDFLARE_BYPASS_SECRET) {
    headers.set("x-cf-bypass", process.env.CLOUDFLARE_BYPASS_SECRET);
  }
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("User-Agent", userAgent);
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) headers.set("Accept-Language", acceptLanguage);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  const init: RequestInit = { method, headers, signal: controller.signal };
  if (method !== "GET") {
    init.body = await request.text();
  }

  let response: Response;
  try {
    response = await fetch(upstreamUrl, init);
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ error: errorKey }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }

  // 2xx + 4xx: pass through verbatim (client renders 4xx bodies inline).
  if (response.status < 500) {
    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5xx: mask.
  const clientIp = getClientIp(request);
  const responseText = await response.text();
  console.error("Admin upstream error:", {
    ip: clientIp,
    path,
    status: response.status,
    responseText:
      responseText.length > 1000
        ? `${responseText.slice(0, 1000)}... (truncated)`
        : responseText,
  });
  return NextResponse.json({ error: errorKey }, { status: 500 });
}
