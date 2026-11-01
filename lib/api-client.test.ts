import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  login,
  verify2FA,
  enroll2FA,
  confirm2FA,
  disable2FA,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
  adminVerifyUser,
  adminChangeRole,
  logout,
} from "@/lib/api-client";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

function jsonRes(status: number, body: unknown = {}) {
  return new Response(JSON.stringify(body), { status });
}

function sentBody(call = 0): Record<string, unknown> {
  const [, init] = fetchMock.mock.calls[call] as [string, RequestInit];
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

describe("login", () => {
  it("maps 2fa_required to twoFactorRequired", async () => {
    fetchMock.mockResolvedValue(jsonRes(200, { status: "2fa_required" }));
    await expect(login("u@t.com", "pw", "tok")).resolves.toEqual({
      ok: true,
      twoFactorRequired: true,
    });
  });

  it("plain ok is not two-factor", async () => {
    fetchMock.mockResolvedValue(jsonRes(200, { status: "ok" }));
    await expect(login("u@t.com", "pw", "tok")).resolves.toEqual({
      ok: true,
      twoFactorRequired: false,
    });
  });

  it("relays error message and retry_after_seconds", async () => {
    fetchMock.mockResolvedValue(
      jsonRes(429, { error: "Too many attempts", retry_after_seconds: 120 }),
    );
    await expect(login("u@t.com", "pw", "tok")).resolves.toEqual({
      ok: false,
      error: "Too many attempts",
      status: 429,
      retryAfterSeconds: 120,
    });
  });

  it("network error → status 0", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(login("u@t.com", "pw", "tok")).resolves.toEqual({
      ok: false,
      error: "Network error",
      status: 0,
    });
  });
});

describe("verify2FA", () => {
  it("ok", async () => {
    fetchMock.mockResolvedValue(jsonRes(200));
    await expect(verify2FA("123456")).resolves.toEqual({ ok: true });
  });

  it.each([
    [401, "totp_locked", "locked"],
    [401, "session_expired", "expired"],
    [401, "invalid_code", "invalid"],
    [400, undefined, "invalid"],
    [404, undefined, "unavailable"],
    [500, undefined, "error"],
  ])("status %s code %s → %s", async (status, code, reason) => {
    fetchMock.mockResolvedValue(jsonRes(status, code ? { code } : {}));
    await expect(verify2FA("123456")).resolves.toEqual({
      ok: false,
      reason,
    });
  });

  it("network error → error", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(verify2FA("123456")).resolves.toEqual({
      ok: false,
      reason: "error",
    });
  });
});

describe("enroll2FA", () => {
  it("returns the secret and otpauth URL", async () => {
    fetchMock.mockResolvedValue(
      jsonRes(200, { secret: "S3C", otpauth_url: "otpauth://totp/x" }),
    );
    await expect(enroll2FA()).resolves.toEqual({
      ok: true,
      secret: "S3C",
      otpauthUrl: "otpauth://totp/x",
    });
  });

  it("malformed success body → failure with the status", async () => {
    fetchMock.mockResolvedValue(jsonRes(200, { secret: "S3C" }));
    await expect(enroll2FA()).resolves.toEqual({ ok: false, status: 200 });
  });

  it("relays failure status", async () => {
    fetchMock.mockResolvedValue(jsonRes(404));
    await expect(enroll2FA()).resolves.toEqual({ ok: false, status: 404 });
  });

  it("network error → status 0", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(enroll2FA()).resolves.toEqual({ ok: false, status: 0 });
  });
});

describe("confirm2FA / disable2FA (totpMutate)", () => {
  it.each([
    [403, "password"],
    [400, "code"],
    [401, "unauthorized"],
    [404, "unavailable"],
    [500, "error"],
  ])("status %s → reason %s", async (status, reason) => {
    fetchMock.mockResolvedValue(jsonRes(status));
    await expect(confirm2FA("123456", "pw")).resolves.toEqual({
      ok: false,
      reason,
    });
  });

  it("ok", async () => {
    fetchMock.mockResolvedValue(jsonRes(200));
    await expect(disable2FA("123456", "pw")).resolves.toEqual({ ok: true });
  });

  it("posts code + current_password to the right path", async () => {
    fetchMock.mockResolvedValue(jsonRes(200));
    await disable2FA("123456", "pw");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/2fa/disable");
    expect(sentBody()).toEqual({ code: "123456", current_password: "pw" });
  });

  it("network error → error", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(confirm2FA("123456", "pw")).resolves.toEqual({
      ok: false,
      reason: "error",
    });
  });
});

describe("forgotPassword", () => {
  it("ok", async () => {
    fetchMock.mockResolvedValue(jsonRes(200));
    await expect(forgotPassword("u@t.com", "tok")).resolves.toEqual({
      ok: true,
    });
    expect(sentBody()).toEqual({
      email: "u@t.com",
      cf_turnstile_response: "tok",
    });
  });

  it("relays retry_after_seconds", async () => {
    fetchMock.mockResolvedValue(
      jsonRes(429, { error: "slow down", retry_after_seconds: 300 }),
    );
    await expect(forgotPassword("u@t.com", "tok")).resolves.toEqual({
      ok: false,
      error: "slow down",
      status: 429,
      retryAfterSeconds: 300,
    });
  });

  it("network error → status 0", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(forgotPassword("u@t.com", "tok")).resolves.toEqual({
      ok: false,
      error: "Network error",
      status: 0,
    });
  });
});

describe("resetPassword", () => {
  it("ok", async () => {
    fetchMock.mockResolvedValue(jsonRes(200));
    await expect(resetPassword("tok", "newpass123")).resolves.toEqual({
      ok: true,
    });
    expect(sentBody()).toEqual({ token: "tok", new_password: "newpass123" });
  });

  it("relays the stable token code", async () => {
    fetchMock.mockResolvedValue(
      jsonRes(400, { error: "link expired", code: "expired_token" }),
    );
    await expect(resetPassword("tok", "newpass123")).resolves.toEqual({
      ok: false,
      error: "link expired",
      status: 400,
      code: "expired_token",
      retryAfterSeconds: undefined,
    });
  });

  it("relays retry_after_seconds", async () => {
    fetchMock.mockResolvedValue(
      jsonRes(429, { error: "slow down", retry_after_seconds: 60 }),
    );
    await expect(resetPassword("tok", "newpass123")).resolves.toMatchObject({
      ok: false,
      status: 429,
      retryAfterSeconds: 60,
    });
  });

  it("network error → status 0", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(resetPassword("tok", "newpass123")).resolves.toEqual({
      ok: false,
      error: "Network error",
      status: 0,
    });
  });
});

describe("getProfile", () => {
  it("ok returns the profile", async () => {
    fetchMock.mockResolvedValue(jsonRes(200, { name: "Test" }));
    await expect(getProfile()).resolves.toEqual({
      ok: true,
      profile: { name: "Test" },
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/profile");
  });

  it("non-2xx → status", async () => {
    fetchMock.mockResolvedValue(jsonRes(401));
    await expect(getProfile()).resolves.toEqual({ ok: false, status: 401 });
  });

  it("network error → status 0", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(getProfile()).resolves.toEqual({ ok: false, status: 0 });
  });
});

describe("updateProfile", () => {
  it("ok", async () => {
    fetchMock.mockResolvedValue(jsonRes(200, { status: "ok" }));
    await expect(updateProfile({ name: "X" })).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/profile");
  });

  it("401 → unauthorized", async () => {
    fetchMock.mockResolvedValue(jsonRes(401));
    await expect(updateProfile({})).resolves.toEqual({
      ok: false,
      error: "unauthorized",
    });
  });

  it("400 relays the backend message", async () => {
    fetchMock.mockResolvedValue(jsonRes(400, { error: "bad category" }));
    await expect(updateProfile({})).resolves.toEqual({
      ok: false,
      error: "validation",
      message: "bad category",
    });
  });

  it("400 with non-JSON body → empty message", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 400 }));
    await expect(updateProfile({})).resolves.toEqual({
      ok: false,
      error: "validation",
      message: "",
    });
  });

  it("5xx → server", async () => {
    fetchMock.mockResolvedValue(jsonRes(500));
    await expect(updateProfile({})).resolves.toEqual({
      ok: false,
      error: "server",
    });
  });

  it("network error → server", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(updateProfile({})).resolves.toEqual({
      ok: false,
      error: "server",
    });
  });
});

describe("adminListUsers", () => {
  it("builds the query string from params", async () => {
    fetchMock.mockResolvedValue(jsonRes(200, { members: [] }));
    await adminListUsers({ page: 2, size: 50, q: "budi", pending: true });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/admin/users?page=2&size=50&q=budi&pending=true",
    );
  });

  it("omits the query string without params", async () => {
    fetchMock.mockResolvedValue(jsonRes(200, { members: [] }));
    await adminListUsers();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/users");
  });

  it("non-2xx → status; network error → 0", async () => {
    fetchMock.mockResolvedValue(jsonRes(403));
    await expect(adminListUsers()).resolves.toEqual({
      ok: false,
      status: 403,
    });
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(adminListUsers()).resolves.toEqual({ ok: false, status: 0 });
  });
});

describe("adminGetUser", () => {
  it("ok returns the profile", async () => {
    fetchMock.mockResolvedValue(jsonRes(200, { name: "X" }));
    await expect(adminGetUser(7)).resolves.toEqual({
      ok: true,
      profile: { name: "X" },
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/users/7");
  });

  it("failure and network error map to status", async () => {
    fetchMock.mockResolvedValue(jsonRes(404));
    await expect(adminGetUser(7)).resolves.toEqual({ ok: false, status: 404 });
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(adminGetUser(7)).resolves.toEqual({ ok: false, status: 0 });
  });
});

describe("admin mutations", () => {
  it("adminUpdateUser PUTs the body", async () => {
    fetchMock.mockResolvedValue(jsonRes(200));
    await expect(adminUpdateUser(3, { name: "N" })).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/users/3");
    expect(sentBody()).toEqual({ name: "N" });
  });

  it("adminVerifyUser POSTs without a body", async () => {
    fetchMock.mockResolvedValue(jsonRes(200));
    await adminVerifyUser(3);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });

  it("adminChangeRole PUTs { role }", async () => {
    fetchMock.mockResolvedValue(jsonRes(200));
    await adminChangeRole(3, "admin");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/users/3/role");
    expect(sentBody()).toEqual({ role: "admin" });
  });

  it("failure relays the backend error message", async () => {
    fetchMock.mockResolvedValue(jsonRes(403, { error: "forbidden" }));
    await expect(adminUpdateUser(3, {})).resolves.toEqual({
      ok: false,
      status: 403,
      error: "forbidden",
    });
  });

  it("non-JSON failure body → empty error; network error → status 0", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 500 }));
    await expect(adminUpdateUser(3, {})).resolves.toEqual({
      ok: false,
      status: 500,
      error: "",
    });
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(adminUpdateUser(3, {})).resolves.toEqual({
      ok: false,
      status: 0,
      error: "",
    });
  });
});

describe("logout", () => {
  it("resolves even when the network fails", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(logout()).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/logout");
  });
});
