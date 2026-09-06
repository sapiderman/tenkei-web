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
function resetRequest(
  body: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  ipCounter += 1;
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": `10.2.0.${ipCounter}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function importRoute() {
  const mod = await import("./route");
  return mod.POST;
}

const TOKEN = "a".repeat(64); // sha256-hex-shaped token

describe("POST /api/auth/reset-password", () => {
  it("forwards correct upstream URL and body", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    await POST(resetRequest({ token: TOKEN, new_password: "newpassword1" }));

    expect(mockFetch).toHaveBeenCalledOnce();
    const call = mockFetch.mock.calls[0] as unknown[];
    expect(call[0]).toBe("http://backend:3000/v1/auth/reset-password");
    const init = call[1] as RequestInit;
    expect(new Headers(init.headers).get("x-cf-bypass")).toBe("test-secret");
    expect(JSON.parse(init.body as string)).toEqual({
      token: TOKEN,
      new_password: "newpassword1",
    });
  });

  it("relays upstream 200 as {status: ok}", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
      ),
    );
    const POST = await importRoute();
    const res = await POST(
      resetRequest({ token: TOKEN, new_password: "newpassword1" }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("ok");
  });

  it("rejects missing token", async () => {
    const POST = await importRoute();
    const res = await POST(resetRequest({ new_password: "newpassword1" }));
    expect(res.status).toBe(400);
  });

  it("rejects password shorter than 8 before hitting upstream", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    const POST = await importRoute();
    const res = await POST(
      resetRequest({ token: TOKEN, new_password: "short" }),
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects password longer than 72 before hitting upstream", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    const POST = await importRoute();
    const res = await POST(
      resetRequest({ token: TOKEN, new_password: "a".repeat(73) }),
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("relays token-state error codes from upstream 400", async () => {
    for (const code of ["invalid_token", "expired_token", "used_token"]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(
          async () =>
            new Response(JSON.stringify({ error: "x", code }), { status: 400 }),
        ),
      );
      const POST = await importRoute();
      const res = await POST(
        resetRequest({ token: TOKEN, new_password: "newpassword1" }),
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe(code);
    }
  });

  it("maps upstream 500 to a generic 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );
    const POST = await importRoute();
    const res = await POST(
      resetRequest({ token: TOKEN, new_password: "newpassword1" }),
    );
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).not.toContain("boom");
  });

  it("passes through upstream 429 with retry-after", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 429 })),
    );
    const POST = await importRoute();
    const res = await POST(
      resetRequest({ token: TOKEN, new_password: "newpassword1" }),
    );
    expect(res.status).toBe(429);
    expect((await res.json()).retry_after_seconds).toBe(60);
  });

  it("rate-limits after the budget for one IP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 200 })),
    );
    const POST = await importRoute();
    const ip = "10.8.8.8";
    let last: Response | undefined;
    for (let i = 0; i < 11; i++) {
      last = await POST(
        resetRequest(
          { token: TOKEN, new_password: "newpassword1" },
          { "cf-connecting-ip": ip },
        ),
      );
    }
    expect(last?.status).toBe(429);
  });
});
