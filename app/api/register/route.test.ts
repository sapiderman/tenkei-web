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

// Meets isValidTurnstileToken: 20–5000 chars, base64-ish charset.
const TURNSTILE_TOKEN = "0.fakeTurnstileTokenABCDEFGH1234567890";

function registerRequest(body: Record<string, unknown>, ip = "10.0.0.1") {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

async function importRoute() {
  const mod = await import("./route");
  return mod.POST;
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Test User",
    email: "reg-test@example.com",
    whatsapp: "+6281234567890",
    date_of_birth: "1990-01-15",
    password: "securepass123",
    password_confirm: "securepass123",
    consent_datastore: true,
    cf_turnstile_response: TURNSTILE_TOKEN,
    ...overrides,
  };
}

function okFetch() {
  return vi.fn(
    async () => new Response(JSON.stringify({ status: "ok" }), { status: 201 }),
  );
}

describe("POST /api/register — faculty/major rule", () => {
  it("UI dojo without faculty → 400, nothing forwarded upstream", async () => {
    const mockFetch = okFetch();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(
      registerRequest(
        validPayload({
          dojo: "Tenkei Universitas Indonesia",
          major: "Teknik Elektro",
        }),
      ),
    );

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Faculty and major are required");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("UI dojo without major → 400", async () => {
    const POST = await importRoute();
    const res = await POST(
      registerRequest(
        validPayload({
          dojo: "Tenkei Universitas Indonesia",
          faculty: "Fakultas Teknik",
        }),
        "10.0.0.2",
      ),
    );

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Faculty and major are required");
  });

  it("faculty over 100 chars → 400", async () => {
    const POST = await importRoute();
    const res = await POST(
      registerRequest(
        validPayload({
          dojo: "Tenkei Mayapada",
          faculty: "a".repeat(101),
        }),
        "10.0.0.3",
      ),
    );

    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Faculty is too long");
  });

  it("UI dojo with both fields → forwards faculty/major upstream", async () => {
    const mockFetch = okFetch();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(
      registerRequest(
        validPayload({
          dojo: "Tenkei Universitas Indonesia",
          faculty: "Fakultas Teknik",
          major: "Teknik Elektro",
        }),
        "10.0.0.4",
      ),
    );

    expect(res.status).toBe(201);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as unknown[];
    expect(String(url)).toBe("http://backend:3000/v1/register");
    const forwarded = JSON.parse((init as RequestInit).body as string) as {
      faculty: string;
      major: string;
      dojo: string;
    };
    expect(forwarded.faculty).toBe("Fakultas Teknik");
    expect(forwarded.major).toBe("Teknik Elektro");
    expect(forwarded.dojo).toBe("Tenkei Universitas Indonesia");
  });

  it("non-UI dojo without faculty/major → no requirement, forwards empty", async () => {
    const mockFetch = okFetch();
    vi.stubGlobal("fetch", mockFetch);

    const POST = await importRoute();
    const res = await POST(
      registerRequest(
        validPayload({ dojo: "Tenkei Natsu Aikidojo" }),
        "10.0.0.5",
      ),
    );

    expect(res.status).toBe(201);
    const [, init] = mockFetch.mock.calls[0] as unknown[];
    const forwarded = JSON.parse((init as RequestInit).body as string) as {
      faculty: string;
      major: string;
    };
    expect(forwarded.faculty).toBe("");
    expect(forwarded.major).toBe("");
  });
});
