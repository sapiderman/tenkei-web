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
  return mod.PUT;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PUT /api/admin/users/[id]/role proxy", () => {
  it("PUTs {role} to /v1/admin/users/:id/role", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importRoute();
    await PUT(
      new Request("http://localhost/api/admin/users/42/role", {
        method: "PUT",
        headers: {
          cookie: "tenkei_session=abc",
          "content-type": "application/json",
        },
        body: JSON.stringify({ role: "admin" }),
      }),
      ctx("42"),
    );

    const [url, init] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe("http://backend:3000/v1/admin/users/42/role");
    expect((init as RequestInit).method).toBe("PUT");
    expect((init as RequestInit).body).toBe(JSON.stringify({ role: "admin" }));
  });
});
