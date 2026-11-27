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

describe("PUT /api/admin/attendance/[id]/confirm", () => {
  it("forwards as PUT to the confirm endpoint", async () => {
    const mockFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);

    const { PUT } = await import("./route");
    await PUT(
      new Request("http://localhost/api/admin/attendance/42/confirm", {
        method: "PUT",
        headers: { cookie: "tenkei_session=abc" },
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    const [url, init] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe("http://backend:3000/v1/admin/attendance/42/confirm");
    expect((init as RequestInit).method).toBe("PUT");
  });

  it("409 passes through so the UI can say it was already decided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "decided" }), { status: 409 })),
    );

    const { PUT } = await import("./route");
    const res = await PUT(
      new Request("http://localhost/api/admin/attendance/42/confirm", {
        method: "PUT",
        headers: { cookie: "tenkei_session=abc" },
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(res.status).toBe(409);
  });
});
