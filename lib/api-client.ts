import type { ProfileResponse } from "@/lib/types";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function login(
  identifier: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    if (res.ok) {
      return { ok: true };
    }

    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: typeof body.error === "string" ? body.error : "An error occurred",
      status: res.status,
    };
  } catch {
    return { ok: false, error: "Network error", status: 0 };
  }
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export type ProfileResult =
  | { ok: true; profile: ProfileResponse }
  | { ok: false; status: number };

export async function getProfile(): Promise<ProfileResult> {
  try {
    const res = await fetch("/api/auth/profile", {
      method: "GET",
    });

    if (res.ok) {
      // Backend is trusted for shape; cast is acceptable per PRD.
      const profile = (await res.json()) as ProfileResponse;
      return { ok: true, profile };
    }

    return { ok: false, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

/**
 * Calls the logout proxy. Always resolves — the proxy guarantees a cleared
 * cookie and 200 even if the backend is unreachable.
 */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Swallow — logout must succeed client-side regardless.
  }
}
