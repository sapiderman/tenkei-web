import type { ProfileResponse, UserListResponse } from "@/lib/types";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginResult =
  | { ok: true; twoFactorRequired: boolean }
  | { ok: false; error: string; status: number; retryAfterSeconds?: number };

export async function login(
  identifier: string,
  password: string,
  turnstileToken: string,
): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier,
        password,
        cf_turnstile_response: turnstileToken,
      }),
    });

    if (res.ok) {
      // `2fa_required`: password OK, member enrolled — the proxy has set a
      // pending session cookie; the client must collect the TOTP code next.
      const body = (await res.json().catch(() => ({}))) as {
        status?: string;
      };
      return {
        ok: true,
        twoFactorRequired: body.status === "2fa_required",
      };
    }

    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: typeof body.error === "string" ? body.error : "An error occurred",
      status: res.status,
      retryAfterSeconds:
        typeof body.retry_after_seconds === "number"
          ? body.retry_after_seconds
          : undefined,
    };
  } catch {
    return { ok: false, error: "Network error", status: 0 };
  }
}

// ---------------------------------------------------------------------------
// Two-factor auth (TOTP)
// ---------------------------------------------------------------------------

/** Error reasons mapped from the proxy's relayed status codes. */
export type TotpMutationResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "password" // 403 — current password wrong
        | "code" // 400 — invalid code
        | "unauthorized" // 401 — session gone, log in again
        | "unavailable" // 404 — TOTP kill switch off server-side
        | "error"; // network / 5xx
    };

/**
 * Login step 2: exchanges the 6-digit code for the promoted session cookie.
 * `locked` means the pending session was deleted (5 wrong codes) and the
 * member must start over with a fresh password login.
 */
export type Verify2FAResult =
  | { ok: true }
  | {
      ok: false;
      reason: "invalid" | "locked" | "expired" | "unavailable" | "error";
    };

export async function verify2FA(code: string): Promise<Verify2FAResult> {
  try {
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (res.ok) return { ok: true };

    const body = (await res.json().catch(() => ({}))) as {
      error?: unknown;
      code?: unknown;
    };
    if (res.status === 401) {
      // `code` is the stable machine identifier from the backend
      // ("invalid_code" | "totp_locked" | "session_expired").
      if (body.code === "totp_locked") {
        return { ok: false, reason: "locked" };
      }
      if (body.code === "session_expired") {
        return { ok: false, reason: "expired" };
      }
      return { ok: false, reason: "invalid" };
    }
    // Proxy's local format-check failure — a client-side mistake, not a
    // server error (mirrors totpMutate's 400 → code/invalid mapping).
    if (res.status === 400) return { ok: false, reason: "invalid" };
    if (res.status === 404) return { ok: false, reason: "unavailable" };
    return { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export type Enroll2FAResult =
  | { ok: true; secret: string; otpauthUrl: string }
  | { ok: false; status: number }; // 409 already enabled, 404 kill switch off, 401 session gone, 0 network

/** Starts enrollment. The secret is shown once — render the QR immediately. */
export async function enroll2FA(): Promise<Enroll2FAResult> {
  try {
    const res = await fetch("/api/auth/2fa/enroll", { method: "POST" });
    if (res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        secret?: unknown;
        otpauth_url?: unknown;
      };
      if (
        typeof body.secret === "string" &&
        typeof body.otpauth_url === "string"
      ) {
        return {
          ok: true,
          secret: body.secret,
          otpauthUrl: body.otpauth_url,
        };
      }
    }
    return { ok: false, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** Shared shape of confirm and disable (both take code + current password). */
async function totpMutate(
  path: string,
  code: string,
  currentPassword: string,
): Promise<TotpMutationResult> {
  try {
    const res = await fetch(`/api/auth/2fa/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, current_password: currentPassword }),
    });

    if (res.ok) return { ok: true };

    if (res.status === 403) return { ok: false, reason: "password" };
    if (res.status === 400) return { ok: false, reason: "code" };
    if (res.status === 401) return { ok: false, reason: "unauthorized" };
    if (res.status === 404) return { ok: false, reason: "unavailable" };
    return { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Arms 2FA with the first code from the authenticator + account password. */
export function confirm2FA(
  code: string,
  currentPassword: string,
): Promise<TotpMutationResult> {
  return totpMutate("confirm", code, currentPassword);
}

/** Disarms 2FA — current code + password required together. */
export function disable2FA(
  code: string,
  currentPassword: string,
): Promise<TotpMutationResult> {
  return totpMutate("disable", code, currentPassword);
}

// ---------------------------------------------------------------------------
// Forgot / reset password
// ---------------------------------------------------------------------------

export type ForgotPasswordResult =
  | { ok: true }
  | { ok: false; error: string; status: number; retryAfterSeconds?: number };

/**
 * Requests a password reset email. The backend answers 200 with a generic
 * message for known and unknown emails alike, so `ok` says nothing about
 * whether the account exists — the UI shows the same confirmation either way.
 */
export async function forgotPassword(
  email: string,
  turnstileToken: string,
): Promise<ForgotPasswordResult> {
  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, cf_turnstile_response: turnstileToken }),
    });

    if (res.ok) {
      return { ok: true };
    }

    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: typeof body.error === "string" ? body.error : "An error occurred",
      status: res.status,
      retryAfterSeconds:
        typeof body.retry_after_seconds === "number"
          ? body.retry_after_seconds
          : undefined,
    };
  } catch {
    return { ok: false, error: "Network error", status: 0 };
  }
}

export type ResetPasswordResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      status: number;
      code?: string;
      retryAfterSeconds?: number;
    };

/**
 * Sets a new password with the emailed token. Token failures (invalid,
 * expired, used) come back with a stable `code` so the UI can render the
 * "request a new link" state; 429s carry `retryAfterSeconds`.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    if (res.ok) {
      return { ok: true };
    }

    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: typeof body.error === "string" ? body.error : "An error occurred",
      status: res.status,
      code: typeof body.code === "string" ? body.code : undefined,
      retryAfterSeconds:
        typeof body.retry_after_seconds === "number"
          ? body.retry_after_seconds
          : undefined,
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
// Update Profile
// ---------------------------------------------------------------------------

// Backend PUT /v1/auth/profile returns {"status":"ok"} with no body data on
// success — there is no Profile to return. The caller re-fetches via getProfile().
export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: "validation"; message: string }
  | { ok: false; error: "unauthorized" }
  | { ok: false; error: "server" };

export async function updateProfile(
  fields: Record<string, unknown>,
): Promise<UpdateProfileResult> {
  try {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    if (res.ok) {
      return { ok: true };
    }

    if (res.status === 401) {
      return { ok: false, error: "unauthorized" };
    }

    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: "validation",
        message: typeof body.error === "string" ? body.error : "",
      };
    }

    return { ok: false, error: "server" };
  } catch {
    return { ok: false, error: "server" };
  }
}

// ---------------------------------------------------------------------------
// Admin: list members
// ---------------------------------------------------------------------------

export interface AdminListParams {
  page?: number;
  size?: number;
  q?: string;
  pending?: boolean;
}

export type AdminListResult =
  | { ok: true; data: UserListResponse }
  | { ok: false; status: number };

/**
 * Fetches the member list via the admin proxy. `status` is 0 on network error,
 * 401 on missing/expired session, 403 on insufficient role.
 */
export async function adminListUsers(
  params: AdminListParams = {},
): Promise<AdminListResult> {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.size != null) search.set("size", String(params.size));
  if (params.q) search.set("q", params.q);
  if (params.pending) search.set("pending", "true");
  const qs = search.toString();

  try {
    const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });

    if (res.ok) {
      const data = (await res.json()) as UserListResponse;
      return { ok: true, data };
    }

    return { ok: false, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

// ---------------------------------------------------------------------------
// Admin: get / update / verify / change-role a single member
// ---------------------------------------------------------------------------

export type AdminUserResult =
  | { ok: true; profile: ProfileResponse }
  | { ok: false; status: number };

export async function adminGetUser(
  id: number | string,
): Promise<AdminUserResult> {
  try {
    const res = await fetch(`/api/admin/users/${id}`, { method: "GET" });
    if (res.ok) {
      const profile = (await res.json()) as ProfileResponse;
      return { ok: true, profile };
    }
    return { ok: false, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** A mutation that surfaces the backend's error message on failure. */
export type AdminMutationResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

async function adminMutate(
  url: string,
  method: "PUT" | "POST",
  body?: unknown,
): Promise<AdminMutationResult> {
  try {
    const res = await fetch(url, {
      method,
      headers:
        body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as { error?: unknown };
    return {
      ok: false,
      status: res.status,
      error: typeof data.error === "string" ? data.error : "",
    };
  } catch {
    return { ok: false, status: 0, error: "" };
  }
}

export function adminUpdateUser(
  id: number | string,
  body: Record<string, unknown>,
): Promise<AdminMutationResult> {
  return adminMutate(`/api/admin/users/${id}`, "PUT", body);
}

export function adminVerifyUser(
  id: number | string,
): Promise<AdminMutationResult> {
  return adminMutate(`/api/admin/users/${id}/verify`, "POST");
}

export function adminChangeRole(
  id: number | string,
  role: string,
): Promise<AdminMutationResult> {
  return adminMutate(`/api/admin/users/${id}/role`, "PUT", { role });
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
