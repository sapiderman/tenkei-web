import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Save and restore env between tests
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.BE_API_BASE = "http://backend:3000";
  process.env.CLOUDFLARE_BYPASS_SECRET = "test-secret";
});

afterEach(() => {
  // Restore env
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, originalEnv);
  vi.restoreAllMocks();
});


// Helper to build a login request
function loginRequest(body: Record<string, unknown>, headers?: Record<string, string>) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

// Helper to parse Set-Cookie from response headers
function getSetCookie(response: Response): string | null {
  return response.headers.get("set-cookie");
}

// Import the route after env is set up
async function importRoute() {
  // Dynamic import to pick up env changes
  const mod = await import("./route");
  return mod.POST;
}

describe("POST /api/auth/login", () => {
  it("forwards correct upstream URL", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "set-cookie": "tenkei_session=abc; Path=/v1/auth; HttpOnly" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest({ identifier: "user@test.com", password: "password123" });
    await POST(req);

    expect(mockFetch).toHaveBeenCalledOnce();
    const call = mockFetch.mock.calls[0] as unknown[];
    expect(call[0]).toBe("http://backend:3000/v1/auth/login");
  });

  it("sends x-cf-bypass header and Content-Type", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "set-cookie": "tenkei_session=abc; Path=/v1/auth; HttpOnly" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest({ identifier: "user@test.com", password: "password123" });
    await POST(req);

    const call = mockFetch.mock.calls[0] as unknown[];
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("x-cf-bypass")).toBe("test-secret");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("forwards identifier + password only (no extra fields)", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "set-cookie": "tenkei_session=abc; Path=/v1/auth; HttpOnly" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest({
      identifier: "user@test.com",
      password: "pass1234",
      extraField: "should-not-leak",
    });
    await POST(req);

    const call = mockFetch.mock.calls[0] as unknown[];
    const init = call[1] as RequestInit;
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody).toEqual({ identifier: "user@test.com", password: "pass1234" });
    expect(sentBody).not.toHaveProperty("extraField");
  });

  it("forwards User-Agent and Accept-Language to backend", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "set-cookie": "tenkei_session=abc; Path=/v1/auth; HttpOnly" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest(
      { identifier: "user@test.com", password: "password123" },
      { "user-agent": "TestAgent/1.0", "accept-language": "id" },
    );
    await POST(req);

    const call = mockFetch.mock.calls[0] as unknown[];
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("User-Agent")).toBe("TestAgent/1.0");
    expect(headers.get("Accept-Language")).toBe("id");
  });

  it("returns 400 for non-string identifier", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest({ identifier: 123, password: "pass1234" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 for non-string password", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest({ identifier: "user@test.com", password: null });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 for identifier > 100 chars", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest({
      identifier: "a".repeat(101),
      password: "password123",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 400 for password > 128 chars", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest({
      identifier: "user@test.com",
      password: "a".repeat(129),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("on success: returns 200 and sets browser cookie", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "set-cookie": "tenkei_session=abc123; Path=/v1/auth; HttpOnly; Secure; SameSite=Lax" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest({ identifier: "user@test.com", password: "password123" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });

    const cookie = getSetCookie(res);
    expect(cookie).toContain("tenkei_session=abc123");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    // In test (non-production) NODE_ENV, Secure should NOT be set
    expect(cookie).not.toContain("Secure");
    // Should not contain Domain (host-only)
    expect(cookie).not.toContain("Domain");
  });

  it("sets Secure attribute when NODE_ENV=production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "set-cookie": "tenkei_session=abc123; Path=/v1/auth; HttpOnly" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest({ identifier: "user@test.com", password: "password123" });
    const res = await POST(req);

    const cookie = getSetCookie(res);
    expect(cookie).toContain("Secure");
  });

  it("on backend 401: returns 401 generic error, no cookie", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "invalid credentials" }), { status: 401 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest({ identifier: "user@test.com", password: "wrongpass" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "invalid credentials" });
    expect(getSetCookie(res)).toBeNull();
  });

  it("on backend 500: returns 500 generic error, no cookie", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "internal error" }), { status: 500 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest(
      { identifier: "user@test.com", password: "password123" },
      { "user-agent": "test-500" },
    );
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "login failed" });
    expect(getSetCookie(res)).toBeNull();
  });

  it("on backend non-ok status body: returns 401 generic error, no cookie", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "2fa_required" }), {
        status: 200,
        headers: { "set-cookie": "tenkei_session=abc; Path=/v1/auth; HttpOnly" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest(
      { identifier: "user@test.com", password: "password123" },
      { "user-agent": "test-2fa" },
    );
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "invalid credentials" });
    expect(getSetCookie(res)).toBeNull();
  });

  it("missing BE_API_BASE → 500", async () => {
    delete process.env.BE_API_BASE;

    const POST = await importRoute();
    const req = loginRequest({ identifier: "user@test.com", password: "password123" });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("network error → 500", async () => {
    const mockFetch = vi.fn(async () => {
      throw new Error("network error");
    });
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest(
      { identifier: "user@test.com", password: "password123" },
      { "user-agent": "test-neterr" },
    );
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("timeout (15s) → 500", async () => {
    vi.useFakeTimers();

    // Fetch that never resolves — simulates a hung backend
    const mockFetch = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => {
            reject(
              new DOMException("The operation was aborted.", "AbortError"),
            );
          },
          { once: true },
        );
      });
    });
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const req = loginRequest(
      { identifier: "user@test.com", password: "password123" },
      { "user-agent": "test-timeout" },
    );

    const resPromise = POST(req);
    await vi.advanceTimersByTimeAsync(15_001);

    const res = await resPromise;
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "login failed" });
    expect(getSetCookie(res)).toBeNull();

    vi.useRealTimers();
  });

  it("rate limiting: 11th request from same key → 429", async () => {
    // Note: rate limiter is per-module state; this test depends on the
    // module-level RATE_LIMIT_MAP not being shared across dynamic imports.
    // Since vitest reuses the module, we must test incrementally.
    // This test sends 11 requests and expects the 11th to be 429.
    const mockFetch = vi.fn(async () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "set-cookie": "tenkei_session=abc; Path=/v1/auth; HttpOnly" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const makeReq = () =>
      loginRequest(
        { identifier: "user@test.com", password: "password123" },
        { "cf-connecting-ip": "1.2.3.4", "user-agent": "rate-test-agent" },
      );

    // Send 10 requests — all should pass (may count from prior tests if
    // they share the same ip:ua key, but each test uses a unique user-agent
    // so the rate limiter keys are distinct).
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeReq());
      // May be 200 or could be 401 depending on stub, but not 429
      expect(res.status).not.toBe(429);
    }

    // 11th should be rate limited
    const res11 = await POST(makeReq());
    expect(res11.status).toBe(429);
    const body = await res11.json();
    expect(body.error).toContain("Too many");
    // Should NOT have called fetch on the 11th
    // (fetch was called 10 times in the loop, not 11)
    expect(mockFetch).toHaveBeenCalledTimes(10);
  });
});
