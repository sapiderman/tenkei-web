/**
 * Shared helpers for the auth proxy routes.
 *
 * Co-located with the only code that uses them (app/api/auth/).
 * Not exported to the client.
 */

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * Returns the full upstream URL for the given auth path.
 * Throws if BE_API_BASE is not set.
 */
export function getUpstreamUrl(path: string): string {
  const base = process.env.BE_API_BASE;
  if (base) {
    return `${base.replace(/\/+$/, "")}${path}`;
  }
  throw new Error("BE_API_BASE is not configured");
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

/**
 * Returns the Set-Cookie attribute fragment for the tenkei_session cookie
 * as issued to the browser (frontend domain).
 *
 * Attributes: Path=/; HttpOnly; SameSite=Lax; [Secure in production]
 * No Domain — host-only cookie.
 */
export function buildSessionCookieAttributes(): string {
  const parts = ["Path=/", "HttpOnly", "SameSite=Lax"];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/**
 * Returns the full Set-Cookie header value that clears the tenkei_session
 * cookie. Uses the same attributes as set time + Max-Age=0.
 */
export function clearSessionCookieHeader(): string {
  return `tenkei_session=; Max-Age=0; ${buildSessionCookieAttributes()}`;
}

/**
 * Extracts the tenkei_session value from a backend Set-Cookie header string.
 * Returns the value if found, or null.
 *
 * Example input: "tenkei_session=abc123; Path=/v1/auth; HttpOnly; Secure; SameSite=Lax"
 */
export function parseTenkeiSessionCookie(
  setCookieHeader: string | null,
): string | null {
  if (!setCookieHeader) return null;
  // Split on ; to get the name=value part
  const parts = setCookieHeader.split(";");
  const first = parts[0]?.trim();
  if (!first) return null;
  const eqIdx = first.indexOf("=");
  if (eqIdx === -1) return null;
  const name = first.slice(0, eqIdx).trim();
  const value = first.slice(eqIdx + 1).trim();
  if (name === "tenkei_session" && value) return value;
  return null;
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, per-instance)
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min (matches register route)
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 per window (matches register route)
const RATE_LIMIT_MAP = new Map<string, { count: number; expiresAt: number }>();

/**
 * Returns a rate-limit key derived from the client IP and user agent.
 * Matches the register route's key derivation exactly.
 */
export function getRateLimitKey(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  const clientIp =
    cfConnectingIp || xForwardedFor?.split(",")[0]?.trim() || "unknown-ip";
  return `${clientIp}:${userAgent}`;
}

/**
 * Returns true if the request is over the rate limit.
 * Increments the counter for the given key.
 */
export function isRateLimited(request: Request): boolean {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const existing = RATE_LIMIT_MAP.get(key);

  if (!existing || existing.expiresAt <= now) {
    RATE_LIMIT_MAP.set(key, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  return false;
}

// ---------------------------------------------------------------------------
// Audit logging (never log passwords)
// ---------------------------------------------------------------------------

/**
 * Hashes an identifier (email or WhatsApp) for safe logging.
 * Uses SHA-256 via the Web Crypto API, truncated to 16 hex chars.
 * Falls back to a simple marker if crypto is unavailable.
 */
export async function hashIdentifierForLog(
  identifier: string,
): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(identifier);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16);
  } catch {
    return "[hash-unavailable]";
  }
}

/**
 * Extracts the client IP from the request headers.
 */
export function getClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const xForwardedFor = request.headers.get("x-forwarded-for");
  return cfConnectingIp || xForwardedFor?.split(",")[0]?.trim() || "unknown-ip";
}
