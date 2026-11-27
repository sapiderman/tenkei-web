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

describe("POST /api/attendance (log proxy)", () => {
  it("forwards only loggable fields with the session cookie", async () => {
    const mockFetch = vi.fn(async () => new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/attendance", {
        method: "POST",
        headers: {
          cookie: "tenkei_session=abc",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          dojo: "Tenkei Mayapada",
          instructor: "TBD",
          latitude: -6.2,
          longitude: 106.8,
          location_accuracy_m: 10,
          role: "superuser",
          user_id: 99,
        }),
      }),
    );

    expect(res.status).toBe(201);
    const [url, init] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe("http://backend:3000/v1/attendance");
    expect((init as RequestInit).method).toBe("POST");
    expect(((init as RequestInit).headers as Headers).get("Cookie")).toBe(
      "tenkei_session=abc",
    );
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      dojo: "Tenkei Mayapada",
      instructor: "TBD",
      latitude: -6.2,
      longitude: 106.8,
      location_accuracy_m: 10,
    });
  });

  it("forwards an empty body when the payload is not JSON (backend answers 400)", async () => {
    const mockFetch = vi.fn(
      async () => new Response(JSON.stringify({ error: "bad" }), { status: 400 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/attendance", {
        method: "POST",
        headers: { cookie: "tenkei_session=abc" },
        body: "not json",
      }),
    );

    expect(res.status).toBe(400);
    const [, init] = mockFetch.mock.calls[0] as unknown[];
    expect((init as RequestInit).body).toBe("{}");
  });

  it("401s before touching the network when there is no session", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/attendance", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("GET /api/attendance (own history proxy)", () => {
  it("forwards the query string upstream", async () => {
    const mockFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);

    const { GET } = await import("./route");
    await GET(
      new Request("http://localhost/api/attendance?page=2&size=10", {
        headers: { cookie: "tenkei_session=abc" },
      }),
    );

    const [url] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe("http://backend:3000/v1/attendance/me?page=2&size=10");
  });
});
