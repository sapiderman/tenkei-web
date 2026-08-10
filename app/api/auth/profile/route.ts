import { NextResponse } from "next/server";
import { getUpstreamUrl, getClientIp } from "../_lib";

/** Fields the client is allowed to send upstream. */
const EDITABLE_FIELDS = new Set([
  "name",
  "date_of_birth",
  "dojo",
  "rank",
  "last_grading_date",
  "medical_conditions",
  "emergency_contact_name",
  "emergency_contact_number",
  "consent_marketing",
  "whatsapp",
]);

function filterEditable(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) out[key] = body[key];
  }
  return out;
}

/** Extracts the tenkei_session cookie value, or null. */
function getSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = /(?:^|;\s*)tenkei_session=([^;]+)/.exec(cookieHeader);
  return match?.[1] ?? null;
}

function forwardHeaders(request: Request): Headers {
  const headers = new Headers();
  const session = getSessionCookie(request);
  if (session) headers.set("Cookie", `tenkei_session=${session}`);
  if (process.env.CLOUDFLARE_BYPASS_SECRET) {
    headers.set("x-cf-bypass", process.env.CLOUDFLARE_BYPASS_SECRET);
  }
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("User-Agent", userAgent);
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) headers.set("Accept-Language", acceptLanguage);
  return headers;
}

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

  // 2. Read session cookie
  if (!getSessionCookie(request)) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  // 3. Forward to backend
  const headers = forwardHeaders(request);
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

export async function PUT(request: Request) {
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

  // 2. Read session cookie
  if (!getSessionCookie(request)) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  // 3. Parse body, filter to editable fields only
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const filtered = filterEditable(body);

  // 4. Forward to backend
  const headers = forwardHeaders(request);
  headers.set("Content-Type", "application/json");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let response: Response;
  try {
    response = await fetch(upstreamUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(filtered),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json({ error: "profile_unavailable" }, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }

  // 5. 2xx: pass through
  if (response.ok) {
    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 6. 400: pass through (validation errors)
  if (response.status === 400) {
    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 7. 401: pass through
  if (response.status === 401) {
    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 8. 5xx or other: generic error
  const clientIp = getClientIp(request);
  const responseText = await response.text();
  const truncated =
    responseText.length > 1000
      ? `${responseText.slice(0, 1000)}... (truncated)`
      : responseText;

  console.error("Profile PUT upstream error:", {
    ip: clientIp,
    status: response.status,
    responseText: truncated,
  });

  return NextResponse.json({ error: "profile_unavailable" }, { status: 500 });
}
