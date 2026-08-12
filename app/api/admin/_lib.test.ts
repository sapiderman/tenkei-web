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

function adminRequest(
  path: string,
  init: { method?: string; cookie?: string; body?: string } = {},
) {
  const headers: Record<string, string> = {};
  if (init.cookie) headers["cookie"] = init.cookie;
  return new Request(`http://localhost${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body,
  });
}

async function importHelper() {
  const mod = await import("./_lib");
  return mod.forwardAuthed;
}

describe("forwardAuthed", () => {
  it("2xx: passes status + body through unchanged", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ members: [] }), { status: 200 }),
      ),
    );

    const forwardAuthed = await importHelper();
    const res = await forwardAuthed({
      path: "/v1/admin/users",
      request: adminRequest("/api/admin/users", {
        cookie: "tenkei_session=abc",
      }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ members: [] });
  });

  it("4xx: passes body through verbatim (client renders backend error messages)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: "An account with this email already exists.",
            }),
            { status: 409 },
          ),
      ),
    );

    const forwardAuthed = await importHelper();
    const res = await forwardAuthed({
      path: "/v1/admin/users/42",
      request: adminRequest("/api/admin/users/42", {
        method: "PUT",
        cookie: "tenkei_session=abc",
      }),
    });

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "An account with this email already exists.",
    });
  });

  it("5xx: masked to 500 with the errorKey, raw body not forwarded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ error: "database connection failed" }),
            {
              status: 500,
            },
          ),
      ),
    );

    const forwardAuthed = await importHelper();
    const res = await forwardAuthed({
      path: "/v1/admin/users",
      request: adminRequest("/api/admin/users", {
        cookie: "tenkei_session=abc",
      }),
      errorKey: "users_unavailable",
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "users_unavailable" });
    expect(JSON.stringify(body)).not.toContain("database");
  });

  it("missing cookie → 401 no_session, fetch not called", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const forwardAuthed = await importHelper();
    const res = await forwardAuthed({
      path: "/v1/admin/users",
      request: adminRequest("/api/admin/users"),
    });

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("no_session");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("forwards cookie + x-cf-bypass + the full path (with query) upstream", async () => {
    const mockFetch = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);

    const forwardAuthed = await importHelper();
    await forwardAuthed({
      path: "/v1/admin/users?page=2&size=25",
      request: adminRequest("/api/admin/users", {
        cookie: "tenkei_session=abc",
      }),
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as unknown[];
    expect(url).toBe("http://backend:3000/v1/admin/users?page=2&size=25");
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Cookie")).toBe("tenkei_session=abc");
    expect(headers.get("x-cf-bypass")).toBe("test-secret");
  });

  it("PUT: forwards method, body, and sets Content-Type", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const forwardAuthed = await importHelper();
    await forwardAuthed({
      path: "/v1/admin/users/42",
      request: adminRequest("/api/admin/users/42", {
        method: "PUT",
        cookie: "tenkei_session=abc",
        body: JSON.stringify({ name: "Eka" }),
      }),
      method: "PUT",
    });

    const [, init] = mockFetch.mock.calls[0] as unknown[];
    expect((init as RequestInit).method).toBe("PUT");
    expect((init as RequestInit).body).toBe(JSON.stringify({ name: "Eka" }));
    expect(new Headers((init as RequestInit).headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("network error → 500 with errorKey", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network error");
      }),
    );

    const forwardAuthed = await importHelper();
    const res = await forwardAuthed({
      path: "/v1/admin/users",
      request: adminRequest("/api/admin/users", {
        cookie: "tenkei_session=abc",
      }),
      errorKey: "users_unavailable",
    });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("users_unavailable");
  });

  it("missing BE_API_BASE → 500", async () => {
    delete process.env.BE_API_BASE;

    const forwardAuthed = await importHelper();
    const res = await forwardAuthed({
      path: "/v1/admin/users",
      request: adminRequest("/api/admin/users", {
        cookie: "tenkei_session=abc",
      }),
    });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeDefined();
  });
});
