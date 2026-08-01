import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.BE_API_BASE = "http://backend:3000";
  process.env.CLOUDFLARE_BYPASS_SECRET = "test-secret";
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  vi.restoreAllMocks();
});

function logoutRequest(cookieHeader?: string) {
  const headers: Record<string, string> = {};
  if (cookieHeader) headers["cookie"] = cookieHeader;
  return new Request("http://localhost/api/auth/logout", {
    method: "POST",
    headers,
  });
}

// Helper to parse Set-Cookie from response headers
function getSetCookie(response: Response): string | null {
  return response.headers.get("set-cookie");
}

async function importRoute() {
  const mod = await import("./route");
  return mod.POST;
}

describe("POST /api/auth/logout", () => {
  it("forwards the cookie upstream when present", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    await POST(logoutRequest("tenkei_session=abc123"));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0] as unknown[];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Cookie")).toBe("tenkei_session=abc123");
  });

  it("sends x-cf-bypass header", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    await POST(logoutRequest("tenkei_session=abc123"));

    const [, init] = mockFetch.mock.calls[0] as unknown[];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("x-cf-bypass")).toBe("test-secret");
  });

  it("2xx upstream → clears browser cookie and passes status/body", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(logoutRequest("tenkei_session=abc123"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });

    const cookie = getSetCookie(res);
    expect(cookie).toContain("tenkei_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    // In test NODE_ENV, Secure should NOT be set
    expect(cookie).not.toContain("Secure");
    expect(cookie).not.toContain("Domain");
  });

  it("sets Secure attribute when NODE_ENV=production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(logoutRequest("tenkei_session=abc123"));

    const cookie = getSetCookie(res);
    expect(cookie).toContain("Secure");
  });

  it("5xx upstream → still clears cookie, returns 200", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "internal error" }), {
          status: 500,
        }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(logoutRequest("tenkei_session=abc123"));

    // Logout must succeed client-side even if backend is unreachable
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });

    const cookie = getSetCookie(res);
    expect(cookie).toContain("Max-Age=0");
  });

  it("network error → still clears cookie, returns 200", async () => {
    const mockFetch = vi.fn(async () => {
      throw new Error("network error");
    });
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(logoutRequest("tenkei_session=abc123"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });

    const cookie = getSetCookie(res);
    expect(cookie).toContain("Max-Age=0");
  });

  it("timeout (15s) → still clears cookie, returns 200", async () => {
    vi.useFakeTimers();

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
    const req = logoutRequest("tenkei_session=abc123");

    const resPromise = POST(req);
    await vi.advanceTimersByTimeAsync(15_001);

    const res = await resPromise;
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
    expect(getSetCookie(res)).toContain("Max-Age=0");

    vi.useRealTimers();
  });

  it("no incoming cookie → upstream not called, cookie still cleared", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(logoutRequest());

    // Should not call upstream if no session to invalidate
    expect(mockFetch).not.toHaveBeenCalled();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });

    const cookie = getSetCookie(res);
    expect(cookie).toContain("Max-Age=0");
  });

  it("clear header attributes match login set header (Path, HttpOnly, SameSite)", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(logoutRequest("tenkei_session=abc123"));

    const cookie = getSetCookie(res);
    // These are the attributes that must match between set and clear
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    // Max-Age=0 ensures the clear works
    expect(cookie).toMatch(/Max-Age=0/);
  });
});
