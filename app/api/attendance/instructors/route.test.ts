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

describe("GET /api/attendance/instructors", () => {
  it("forwards to the roster endpoint with the session cookie", async () => {
    const mockFetch = vi.fn(
      async () => new Response(JSON.stringify({ instructors: { "Tenkei Mayapada": ["A"] } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/attendance/instructors", {
        headers: { cookie: "tenkei_session=abc" },
      }),
    );

    expect(res.status).toBe(200);
    const [url, init] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe("http://backend:3000/v1/attendance/instructors");
    expect(((init as RequestInit).headers as Headers).get("Cookie")).toBe("tenkei_session=abc");
  });

  it("401s before touching the network when there is no session", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/attendance/instructors"));

    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
