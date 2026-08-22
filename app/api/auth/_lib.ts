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
 *
 * CSRF posture: SameSite=Lax + JSON-only fetch mutations (no HTML form
 * posts) is this app's CSRF defense — Lax blocks cross-site POST/PUT.
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
// ponytail: in-memory limit — per-instance only, NOT shared across serverless
// instances (cold starts / fan-out reset it). The backend is the real
// rate-limit gate (register: 5/min/IP). Move to Vercel KV / Upstash for a
// real distributed edge limit.

// Env-tunable with sane fallbacks; unset/garbage → defaults. Read per call
// so changing the env takes effect without a rebuild of the constant.
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 10;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function rateLimitMaxRequests(): number {
  const n = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_RATE_LIMIT_MAX_REQUESTS;
}

function rateLimitWindowMs(): number {
  const n = Number(process.env.RATE_LIMIT_WINDOW_MINUTES);
  return Number.isFinite(n) && n > 0
    ? n * 60 * 1000
    : DEFAULT_RATE_LIMIT_WINDOW_MS;
}

const RATE_LIMIT_MAP = new Map<string, { count: number; expiresAt: number }>();

/**
 * Returns a rate-limit key derived from the client IP only.
 * cf-connecting-ip is set by Cloudflare and trusted; the x-forwarded-for
 * fallback is best-effort (client-controllable if not behind a trusted proxy).
 * Keyed on IP only — including User-Agent would let attackers rotate UAs for
 * fresh budgets.
 */
export function getRateLimitKey(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const xForwardedFor = request.headers.get("x-forwarded-for");
  return cfConnectingIp || xForwardedFor?.split(",")[0]?.trim() || "unknown-ip";
}

/**
 * Checks the rate-limit bucket for the request. Increments the counter when
 * under the limit. `bucket` keeps separate budgets per route family
 * ("login", "register") while sharing one map.
 *
 * Returns the full window (not the live remaining time) on limit — always an
 * upper bound, one less moving part. Safe to reveal: the bucket is keyed on
 * IP, not identifier, so it leaks nothing about whether an account exists.
 */
export function isRateLimited(
  request: Request,
  bucket = "login",
): { limited: boolean; retryAfterSeconds: number } {
  const key = `${bucket}:${getRateLimitKey(request)}`;
  const now = Date.now();
  const existing = RATE_LIMIT_MAP.get(key);

  if (!existing || existing.expiresAt <= now) {
    RATE_LIMIT_MAP.set(key, {
      count: 1,
      expiresAt: now + rateLimitWindowMs(),
    });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (existing.count >= rateLimitMaxRequests()) {
    // ponytail: static window-length cooldown, not live remaining — compute
    // from expiresAt if users complain about over-waiting.
    return {
      limited: true,
      retryAfterSeconds: Math.ceil(rateLimitWindowMs() / 1000),
    };
  }

  existing.count += 1;
  return { limited: false, retryAfterSeconds: 0 };
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
