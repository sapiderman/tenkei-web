import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

let ipCounter = 0;
function enrollRequest(headers?: Record<string, string>) {
  ipCounter += 1;
  return new Request("http://localhost/api/auth/2fa/enroll", {
    method: "POST",
    headers: {
      "cf-connecting-ip": `10.2.0.${ipCounter}`,
      cookie: "tenkei_session=abc",
      ...headers,
    },
    body: JSON.stringify({}),
  });
}

async function importRoute() {
  const mod = await import("./route");
  return mod.POST;
}

describe("POST /api/auth/2fa/enroll", () => {
  it("relays the secret + otpauth_url body verbatim on 200", async () => {
    const upstreamBody = {
      secret: "JBSWY3DPEHPK3PXP",
      otpauth_url:
        "otpauth://totp/Tenkei%20Aikidojo:member@dojo.example?issuer=Tenkei%20Aikidojo&secret=JBSWY3DPEHPK3PXP",
    };
    const mockFetch = vi.fn(
      async () => new Response(JSON.stringify(upstreamBody), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(enrollRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(upstreamBody);

    const call = mockFetch.mock.calls[0] as unknown[];
    // Regression: caller must pass an already-resolved URL — the helpers no
    // longer re-prefix BE_API_BASE (double-prefix broke all 2FA routes).
    expect(call[0]).toBe("http://backend:3000/v1/auth/2fa/enroll");
    const init = call[1] as RequestInit;
    const initHeaders = init.headers as Headers;
    expect(initHeaders.get("cookie")).toBe("tenkei_session=abc");
    expect(initHeaders.get("x-cf-bypass")).toBe("test-secret");
  });

  it("relays 409 (already enabled) with the backend's error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: "2FA is already enabled; disable it first",
            }),
            { status: 409 },
          ),
      ),
    );

    const POST = await importRoute();
    const res = await POST(enrollRequest());

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "2FA is already enabled; disable it first",
    });
  });

  it("requires a session cookie — 401 without one", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(enrollRequest({ cookie: "" }));

    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rate-limits repeated attempts per IP with 429 (no upstream call)", async () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = "1";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 })),
    );

    const POST = await importRoute();
    const first = await POST(enrollRequest({ "cf-connecting-ip": "10.9.9.9" }));
    expect(first.status).toBe(200);

    const second = await POST(enrollRequest({ "cf-connecting-ip": "10.9.9.9" }));
    expect(second.status).toBe(429);
    expect(second.headers.get("Retry-After")).toBeTruthy();
    expect(await second.json()).toEqual({
      error: "Too many attempts. Please try again later.",
      retry_after_seconds: expect.any(Number),
    });
  });

  it("upstream 500 → generic 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );

    const POST = await importRoute();
    const res = await POST(enrollRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "service unavailable" });
  });
});
