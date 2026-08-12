/**
 * Server-side role resolution for cookie-gated pages.
 *
 * Fetches the viewer's profile from the backend using the forwarded session
 * cookie, mirroring what the auth proxy does for the browser. Used by admin
 * pages to redirect insufficient roles away server-side — the client-side
 * hiding is UX only, the backend is the authority.
 */
import { cookies } from "next/headers";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/**
 * Returns the viewer's role string ("new" | "user" | "admin" | "superuser"),
 * or null if the session is absent, the backend is unreachable, or the role
 * is missing.
 *
 * ponytail: null conflates "no session" and "fetch failed". Admin pages treat
 * both as "deny" (redirect to login), which is safe-by-default. Split into a
 * discriminated result if a page must distinguish backend-down from logged-out.
 */
export async function resolveRole(
  cookieStore: CookieStore,
): Promise<string | null> {
  const session = cookieStore.get("tenkei_session")?.value;
  if (!session) return null;

  const base = process.env.BE_API_BASE?.replace(/\/+$/, "");
  if (!base) return null;

  const headers = new Headers();
  headers.set("Cookie", `tenkei_session=${session}`);
  const bypass = process.env.CLOUDFLARE_BYPASS_SECRET;
  if (bypass) headers.set("x-cf-bypass", bypass);

  try {
    const res = await fetch(`${base}/v1/auth/profile`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { role?: unknown };
    return typeof data.role === "string" ? data.role : null;
  } catch {
    return null;
  }
}
