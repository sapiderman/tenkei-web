import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Save and restore env between tests
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.BE_API_BASE = "http://backend:3000";
  process.env.CLOUDFLARE_BYPASS_SECRET = "test-secret";
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, originalEnv);
  vi.restoreAllMocks();
});

const SESSION = "s".repeat(64);
let ipCounter = 0;
function verifyRequest(
  body: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  ipCounter += 1;
  return new Request("http://localhost/api/auth/2fa/verify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": `10.1.0.${ipCounter}`,
      cookie: `tenkei_session=${SESSION}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function okUpstream() {
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: {
      "set-cookie":
        "tenkei_session=promoted789; Path=/v1/auth; HttpOnly; SameSite=Lax",
    },
  });
}

async function importRoute() {
  const mod = await import("./route");
  return mod.POST;
}

describe("POST /api/auth/2fa/verify", () => {
  it("promotes the session: 200 + re-issued promoted cookie", async () => {
    const mockFetch = vi.fn(async () => okUpstream());
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(verifyRequest({ code: "123456" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("tenkei_session=promoted789");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");

    // Upstream got the pending cookie and the bypass header
    const call = mockFetch.mock.calls[0] as unknown[];
    const init = call[1] as RequestInit;
    const initHeaders = init.headers as Headers;
    expect(initHeaders.get("cookie")).toBe(`tenkei_session=${SESSION}`);
    expect(initHeaders.get("x-cf-bypass")).toBe("test-secret");
    expect(init.body).toBe(JSON.stringify({ code: "123456" }));
  });

  // Regression: the real backend promotes the session in place and sends
  // no Set-Cookie — must be a clean 200, not a 500.
  it("promotes without Set-Cookie: 200, no cookie re-issue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
      ),
    );

    const POST = await importRoute();
    const res = await POST(verifyRequest({ code: "123456" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("forwards invalid code 401 with the backend's error string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: "invalid code", code: "invalid_code" }),
            { status: 401 },
          ),
      ),
    );

    const POST = await importRoute();
    const res = await POST(verifyRequest({ code: "000000" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: "invalid code",
      code: "invalid_code",
    });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("forwards lockout 401 (totp_locked) so the UI can restart login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: "too many attempts, login again",
              code: "totp_locked",
            }),
            { status: 401 },
          ),
      ),
    );

    const POST = await importRoute();
    const res = await POST(verifyRequest({ code: "999999" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: "too many attempts, login again",
      code: "totp_locked",
    });
  });

  it("rejects malformed codes locally with 400 (no upstream call)", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    for (const code of ["12345", "1234567", "abcdef", "", "12 456"]) {
      const res = await POST(verifyRequest({ code }));
      expect(res.status).toBe(400);
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("requires a session cookie — 401 without one, no upstream call", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = verifyRequest({ code: "123456" });
    req.headers.delete("cookie");
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: "session expired",
      code: "session_expired",
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("upstream 404 (kill switch off) → relayed as 404 with generic body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not found", { status: 404 })),
    );

    const POST = await importRoute();
    const res = await POST(verifyRequest({ code: "123456" }));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "service unavailable" });
  });
});
