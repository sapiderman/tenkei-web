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

// Unique client IP per request so the module-level rate-limit map doesn't
// bleed state across tests — limiter tests pass one explicit IP throughout.
let ipCounter = 0;
function forgotRequest(
  body: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  ipCounter += 1;
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": `10.1.0.${ipCounter}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function importRoute() {
  const mod = await import("./route");
  return mod.POST;
}

const TURNSTILE = "tok".repeat(20); // passes the format check (>= 20 chars)

describe("POST /api/auth/forgot-password", () => {
  it("forwards correct upstream URL and body", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok", message: "generic" }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    await POST(
      forgotRequest({
        email: "user@test.com",
        cf_turnstile_response: TURNSTILE,
      }),
    );

    expect(mockFetch).toHaveBeenCalledOnce();
    const call = mockFetch.mock.calls[0] as unknown[];
    expect(call[0]).toBe("http://backend:3000/v1/auth/forgot-password");
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("x-cf-bypass")).toBe("test-secret");
    expect(headers.get("content-type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({
      email: "user@test.com",
      cf_turnstile_response: TURNSTILE,
    });
  });

  it("relays the generic 200 regardless of upstream message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ status: "ok", message: "generic" }), {
            status: 200,
          }),
      ),
    );
    const POST = await importRoute();
    const res = await POST(
      forgotRequest({
        email: "user@test.com",
        cf_turnstile_response: TURNSTILE,
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
  });

  it("rejects missing turnstile token", async () => {
    const POST = await importRoute();
    const res = await POST(forgotRequest({ email: "user@test.com" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Security verification required");
  });

  it("rejects malformed turnstile token", async () => {
    const POST = await importRoute();
    const res = await POST(
      forgotRequest({ email: "user@test.com", cf_turnstile_response: "short" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects missing email", async () => {
    const POST = await importRoute();
    const res = await POST(forgotRequest({ cf_turnstile_response: TURNSTILE }));
    expect(res.status).toBe(400);
  });

  it("maps upstream 500 to a generic 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );
    const POST = await importRoute();
    const res = await POST(
      forgotRequest({
        email: "user@test.com",
        cf_turnstile_response: TURNSTILE,
      }),
    );
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).not.toContain("boom");
  });

  it("maps upstream 400 (turnstile rejection) to 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "x" }), { status: 400 }),
      ),
    );
    const POST = await importRoute();
    const res = await POST(
      forgotRequest({
        email: "user@test.com",
        cf_turnstile_response: TURNSTILE,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("passes through upstream 429 with retry-after", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 429 })),
    );
    const POST = await importRoute();
    const res = await POST(
      forgotRequest({
        email: "user@test.com",
        cf_turnstile_response: TURNSTILE,
      }),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("60");
    expect((await res.json()).retry_after_seconds).toBe(60);
  });

  it("rate-limits after the budget for one IP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 })),
    );
    const POST = await importRoute();
    const ip = "10.9.9.9";
    let last: Response | undefined;
    for (let i = 0; i < 11; i++) {
      last = await POST(
        forgotRequest(
          { email: "user@test.com", cf_turnstile_response: TURNSTILE },
          { "cf-connecting-ip": ip },
        ),
      );
    }
    expect(last?.status).toBe(429);
  });
});
