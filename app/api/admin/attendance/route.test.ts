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
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/admin/attendance (list proxy)", () => {
  it("forwards every filter upstream", async () => {
    const mockFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);

    const { GET } = await import("./route");
    await GET(
      new Request(
        "http://localhost/api/admin/attendance?dojo=Tenkei+Mayapada&q=eka&status=pending&from=2026-11-01&to=2026-11-30&page=1&size=25",
        { headers: { cookie: "tenkei_session=abc" } },
      ),
    );

    const [url] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe(
      "http://backend:3000/v1/admin/attendance?dojo=Tenkei+Mayapada&q=eka&status=pending&from=2026-11-01&to=2026-11-30&page=1&size=25",
    );
  });

  it("403 passes through (insufficient role rendered client-side)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "forbidden" }), { status: 403 })),
    );

    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/admin/attendance", {
        headers: { cookie: "tenkei_session=abc" },
      }),
    );

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden");
  });
});
