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
  return { GET: mod.GET, PUT: mod.PUT };
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("/api/admin/users/[id] proxy", () => {
  it("GET forwards /v1/admin/users/:id with the path id", async () => {
    const mockFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);

    const { GET } = await importRoute();
    await GET(
      new Request("http://localhost/api/admin/users/42", {
        headers: { cookie: "tenkei_session=abc" },
      }),
      ctx("42"),
    );

    const [url, init] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe("http://backend:3000/v1/admin/users/42");
    expect((init as RequestInit).method).toBe("GET");
  });

  it("PUT forwards the body to /v1/admin/users/:id", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { PUT } = await importRoute();
    await PUT(
      new Request("http://localhost/api/admin/users/42", {
        method: "PUT",
        headers: {
          cookie: "tenkei_session=abc",
          "content-type": "application/json",
        },
        body: JSON.stringify({ name: "Eka" }),
      }),
      ctx("42"),
    );

    const [url, init] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe("http://backend:3000/v1/admin/users/42");
    expect((init as RequestInit).method).toBe("PUT");
    expect((init as RequestInit).body).toBe(JSON.stringify({ name: "Eka" }));
  });
});
