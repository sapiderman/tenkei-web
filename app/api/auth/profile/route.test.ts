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

function profileRequest(cookieHeader?: string) {
  const headers: Record<string, string> = {};
  if (cookieHeader) headers["cookie"] = cookieHeader;
  return new Request("http://localhost/api/auth/profile", { headers });
}

async function importRoute() {
  const mod = await import("./route");
  return mod.GET;
}

const MOCK_PROFILE = {
  id: "abc-123",
  name: "Test User",
  email: "test@example.com",
  whatsapp: "08123456789",
  dojo: "Tenkei Universitas Indonesia",
  rank: "1st Kyu",
  date_of_birth: "1990-01-15",
  join_date: "2024-06-01",
  last_grading_date: "2025-12-01",
  role: "member",
  consent_datastore: true,
  consent_marketing: false,
  medical_conditions: "",
  emergency_contact_name: "Jane Doe",
  emergency_contact_number: "08198765432",
};

describe("GET /api/auth/profile", () => {
  it("forwards the tenkei_session cookie upstream", async () => {
    const mockFetch = vi.fn(
      async () => new Response(JSON.stringify(MOCK_PROFILE), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const GET = await importRoute();
    await GET(profileRequest("tenkei_session=abc123"));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0] as unknown[];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Cookie")).toBe("tenkei_session=abc123");
  });

  it("sends x-cf-bypass header", async () => {
    const mockFetch = vi.fn(
      async () => new Response(JSON.stringify(MOCK_PROFILE), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const GET = await importRoute();
    await GET(profileRequest("tenkei_session=abc123"));

    const [, init] = mockFetch.mock.calls[0] as unknown[];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("x-cf-bypass")).toBe("test-secret");
  });

  it("2xx: passes status + body through unchanged", async () => {
    const mockFetch = vi.fn(
      async () => new Response(JSON.stringify(MOCK_PROFILE), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const GET = await importRoute();
    const res = await GET(profileRequest("tenkei_session=abc123"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(MOCK_PROFILE);
  });

  it("401: passes through unchanged", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "invalid session" }), {
          status: 401,
        }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const GET = await importRoute();
    const res = await GET(profileRequest("tenkei_session=expired"));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("5xx: returns 500 generic error, raw body not forwarded", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "database connection failed" }), {
          status: 500,
        }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const GET = await importRoute();
    const res = await GET(profileRequest("tenkei_session=abc123"));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "profile_unavailable" });
    // Raw backend error should NOT be in the response
    expect(JSON.stringify(body)).not.toContain("database");
  });

  it("missing cookie → 401, fetch not called", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const GET = await importRoute();
    const res = await GET(profileRequest());

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("no_session");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("network error → 500 generic", async () => {
    const mockFetch = vi.fn(async () => {
      throw new Error("network error");
    });
    vi.stubGlobal("fetch", mockFetch);

    const GET = await importRoute();
    const res = await GET(profileRequest("tenkei_session=abc123"));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "profile_unavailable" });
  });

  it("timeout (15s) → 500 profile_unavailable", async () => {
    vi.useFakeTimers();

    const mockFetch = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => {
            reject(
              new DOMException("The operation was aborted.", "AbortError"),
            );
          },
          { once: true },
        );
      });
    });
    vi.stubGlobal("fetch", mockFetch);

    const GET = await importRoute();
    const req = profileRequest("tenkei_session=abc123");

    const resPromise = GET(req);
    await vi.advanceTimersByTimeAsync(15_001);

    const res = await resPromise;
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "profile_unavailable" });

    vi.useRealTimers();
  });

  it("missing BE_API_BASE → 500", async () => {
    delete process.env.BE_API_BASE;

    const GET = await importRoute();
    const res = await GET(profileRequest("tenkei_session=abc123"));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});

describe("PUT /api/auth/profile", () => {
  async function importPut() {
    const mod = await import("./route");
    return mod.PUT;
  }

  function putRequest(body: Record<string, unknown>, cookieHeader?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cookieHeader) headers["cookie"] = cookieHeader;
    return new Request("http://localhost/api/auth/profile", {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
  }

  it("forwards the tenkei_session cookie upstream", async () => {
    const mockFetch = vi.fn(
      async () => new Response(JSON.stringify(MOCK_PROFILE), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    await PUT(putRequest({ name: "New Name" }, "tenkei_session=abc123"));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0] as unknown[];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Cookie")).toBe("tenkei_session=abc123");
  });

  it("sends x-cf-bypass header", async () => {
    const mockFetch = vi.fn(
      async () => new Response(JSON.stringify(MOCK_PROFILE), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    await PUT(putRequest({ name: "New Name" }, "tenkei_session=abc123"));

    const [, init] = mockFetch.mock.calls[0] as unknown[];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("x-cf-bypass")).toBe("test-secret");
  });

  it("forwards only editable fields", async () => {
    const mockFetch = vi.fn(
      async () => new Response(JSON.stringify(MOCK_PROFILE), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    await PUT(
      putRequest(
        {
          name: "New Name",
          email: "hacker@evil.com",
          password: "bad",
          id: "injected",
          role: "admin",
          consent_marketing: true,
          dojo: "Tenkei",
        },
        "tenkei_session=abc123",
      ),
    );

    const [, init] = mockFetch.mock.calls[0] as unknown[];
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody).toEqual({
      name: "New Name",
      consent_marketing: true,
      dojo: "Tenkei",
    });
    expect(sentBody.whatsapp).toBeUndefined();
    expect(sentBody.email).toBeUndefined();
    expect(sentBody.password).toBeUndefined();
    expect(sentBody.id).toBeUndefined();
    expect(sentBody.role).toBeUndefined();
  });

  it("forwards whatsapp when provided", async () => {
    const mockFetch = vi.fn(
      async () => new Response(JSON.stringify(MOCK_PROFILE), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    await PUT(
      putRequest(
        { name: "New Name", whatsapp: "08123456789" },
        "tenkei_session=abc123",
      ),
    );

    const [, init] = mockFetch.mock.calls[0] as unknown[];
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody.whatsapp).toBe("08123456789");
  });

  it("2xx: passes status + body through unchanged (backend returns {status:ok})", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    const res = await PUT(
      putRequest({ name: "New Name" }, "tenkei_session=abc123"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("400: passes through validation errors", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: "Name must be at most 255 characters" }),
          { status: 400 },
        ),
    );
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    const res = await PUT(
      putRequest({ name: "x".repeat(200) }, "tenkei_session=abc123"),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Name must be at most 255 characters");
  });

  it("401: passes through unchanged", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "invalid session" }), {
          status: 401,
        }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    const res = await PUT(
      putRequest({ name: "New Name" }, "tenkei_session=expired"),
    );

    expect(res.status).toBe(401);
  });

  it("5xx: returns 500 generic error", async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "database connection failed" }), {
          status: 500,
        }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    const res = await PUT(
      putRequest({ name: "New Name" }, "tenkei_session=abc123"),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "profile_unavailable" });
    expect(JSON.stringify(body)).not.toContain("database");
  });

  it("missing cookie → 401, fetch not called", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    const res = await PUT(putRequest({ name: "New Name" }));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("no_session");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("network error → 500 generic", async () => {
    const mockFetch = vi.fn(async () => {
      throw new Error("network error");
    });
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    const res = await PUT(
      putRequest({ name: "New Name" }, "tenkei_session=abc123"),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "profile_unavailable" });
  });

  it("timeout (15s) → 500 profile_unavailable", async () => {
    vi.useFakeTimers();

    const mockFetch = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => {
            reject(
              new DOMException("The operation was aborted.", "AbortError"),
            );
          },
          { once: true },
        );
      });
    });
    vi.stubGlobal("fetch", mockFetch);

    const PUT = await importPut();
    const req = putRequest({ name: "New Name" }, "tenkei_session=abc123");

    const resPromise = PUT(req);
    await vi.advanceTimersByTimeAsync(15_001);

    const res = await resPromise;
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "profile_unavailable" });

    vi.useRealTimers();
  });

  it("invalid JSON body → 400", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      cookie: "tenkei_session=abc123",
    };
    const req = new Request("http://localhost/api/auth/profile", {
      method: "PUT",
      headers,
      body: "not-json",
    });

    const PUT = await importPut();
    const res = await PUT(req);

    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
