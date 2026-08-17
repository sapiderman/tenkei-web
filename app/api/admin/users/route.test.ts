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

async function importRoute() {
  const mod = await import("./route");
  return mod.GET;
}

describe("GET /api/admin/users (list proxy)", () => {
  it("forwards the query string (page/size/q/pending) upstream", async () => {
    const mockFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);

    const GET = await importRoute();
    await GET(
      new Request(
        "http://localhost/api/admin/users?page=2&size=10&q=eka&pending=true",
        { headers: { cookie: "tenkei_session=abc" } },
      ),
    );

    const [url] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe(
      "http://backend:3000/v1/admin/users?page=2&size=10&q=eka&pending=true",
    );
  });

  it("403 passes through (insufficient role rendered client-side)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }),
      ),
    );

    const GET = await importRoute();
    const res = await GET(
      new Request("http://localhost/api/admin/users", {
        headers: { cookie: "tenkei_session=abc" },
      }),
    );

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("forbidden");
  });
});
