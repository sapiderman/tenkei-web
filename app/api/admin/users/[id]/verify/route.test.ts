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
  return mod.POST;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/admin/users/[id]/verify proxy", () => {
  it("POSTs to /v1/admin/users/:id/verify", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    await POST(
      new Request("http://localhost/api/admin/users/42/verify", {
        method: "POST",
        headers: { cookie: "tenkei_session=abc" },
      }),
      ctx("42"),
    );

    const [url, init] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe("http://backend:3000/v1/admin/users/42/verify");
    expect((init as RequestInit).method).toBe("POST");
  });
});
