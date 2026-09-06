import type { ProfileResponse, UserListResponse } from "@/lib/types";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginResult =
  | { ok: true }
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
  | { ok: false; error: string; status: number; code?: string };

/**
 * Sets a new password with the emailed token. Token failures (invalid,
 * expired, used) come back with a stable `code` so the UI can render the
 * "request a new link" state.
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
