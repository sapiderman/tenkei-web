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

/** Runs a POST and returns the parsed error + the upstream fetch mock.
 *  Unique IP per call: the in-memory per-IP limiter would otherwise 429
 *  once a shared address crosses the default cap of 10 requests. */
let ipCounter = 1;
async function post(
  payload: Record<string, unknown>,
): Promise<{ status: number; error: string; mockFetch: ReturnType<typeof okFetch> }> {
  const mockFetch = okFetch();
  vi.stubGlobal("fetch", mockFetch);
  const POST = await importRoute();
  const res = await POST(registerRequest(payload, `10.0.0.${ipCounter++}`));
  const data = (await res.json()) as { error?: string };
  return { status: res.status, error: data.error ?? "", mockFetch };
}

function forwardedBody(mockFetch: ReturnType<typeof okFetch>) {
  const [, init] = mockFetch.mock.calls[0] as unknown[];
  return JSON.parse((init as RequestInit).body as string) as {
    category: string;
    university: string;
    school_name: string;
    guardian_name: string;
    faculty: string;
    major: string;
  };
}

describe("POST /api/register — user category rule", () => {
  it("no category → happy path, forwarded as regular with an empty block", async () => {
    const { status, mockFetch } = await post(validPayload({ dojo: "Tenkei Mayapada" }));

    expect(status).toBe(201);
    expect(String((mockFetch.mock.calls[0] as unknown[])[0])).toBe(
      "http://backend:3000/v1/register",
    );
    const forwarded = forwardedBody(mockFetch);
    expect(forwarded.category).toBe("regular");
    expect(forwarded.university).toBe("");
    expect(forwarded.school_name).toBe("");
    expect(forwarded.guardian_name).toBe("");
    expect(forwarded.faculty).toBe("");
    expect(forwarded.major).toBe("");
  });

  it("empty category → forwarded as regular", async () => {
    const { status, mockFetch } = await post(validPayload({ category: "" }));

    expect(status).toBe(201);
    expect(forwardedBody(mockFetch).category).toBe("regular");
  });

  it("student university path → forwards the whole block verbatim", async () => {
    const { status, mockFetch } = await post(
      validPayload({
        category: "student",
        university: "Universitas Indonesia",
        faculty: "Fakultas Teknik",
        major: "Teknik Elektro",
      }),
    );

    expect(status).toBe(201);
    const forwarded = forwardedBody(mockFetch);
    expect(forwarded.category).toBe("student");
    expect(forwarded.university).toBe("Universitas Indonesia");
    expect(forwarded.faculty).toBe("Fakultas Teknik");
    expect(forwarded.major).toBe("Teknik Elektro");
    expect(forwarded.school_name).toBe("");
    expect(forwarded.guardian_name).toBe("");
  });

  it("student school path → forwards school_name, university fields empty", async () => {
    const { status, mockFetch } = await post(
      validPayload({ category: "student", school_name: "SMA Negeri 1" }),
    );

    expect(status).toBe(201);
    const forwarded = forwardedBody(mockFetch);
    expect(forwarded.category).toBe("student");
    expect(forwarded.school_name).toBe("SMA Negeri 1");
    expect(forwarded.university).toBe("");
    expect(forwarded.faculty).toBe("");
    expect(forwarded.major).toBe("");
    expect(forwarded.guardian_name).toBe("");
  });

  it("kids → forwards guardian_name", async () => {
    const { status, mockFetch } = await post(
      validPayload({ category: "kids", guardian_name: "Ibu Sri" }),
    );

    expect(status).toBe(201);
    const forwarded = forwardedBody(mockFetch);
    expect(forwarded.category).toBe("kids");
    expect(forwarded.guardian_name).toBe("Ibu Sri");
    expect(forwarded.university).toBe("");
  });

  it("new fields are sanitized before forwarding", async () => {
    const { status, mockFetch } = await post(
      validPayload({
        category: "kids",
        guardian_name: "<b>Ibu</b>\nSri<script>alert(1)</script>",
      }),
    );

    expect(status).toBe(201);
    const forwarded = forwardedBody(mockFetch);
    expect(forwarded.guardian_name).not.toContain("<");
    expect(forwarded.guardian_name).not.toContain("script");
    expect(forwarded.guardian_name).toContain("Ibu");
    expect(forwarded.guardian_name).toContain("Sri");
  });

  it("unknown category → 400 Invalid registration category., nothing forwarded", async () => {
    const { status, error, mockFetch } = await post(
      validPayload({ category: "alumni" }),
    );

    expect(status).toBe(400);
    expect(error).toBe("Invalid registration category.");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("regular with university → 400", async () => {
    const { status, error } = await post(
      validPayload({ category: "regular", university: "UI" }),
    );

    expect(status).toBe(400);
    expect(error).toBe(
      "Regular registrations must not include student or guardian fields.",
    );
  });

  it("regular with guardian_name → 400", async () => {
    const { status, error } = await post(
      validPayload({ guardian_name: "Ibu Sri" }),
    );

    expect(status).toBe(400);
    expect(error).toBe(
      "Regular registrations must not include student or guardian fields.",
    );
  });

  it("student missing major → 400", async () => {
    const { status, error } = await post(
      validPayload({
        category: "student",
        university: "UI",
        faculty: "Fakultas Teknik",
      }),
    );

    expect(status).toBe(400);
    expect(error).toBe(
      "University, department, and major are required for student registrations (or school name if still in school).",
    );
  });

  it("student with school and university fields (both paths) → 400", async () => {
    const { status, error } = await post(
      validPayload({
        category: "student",
        university: "UI",
        faculty: "Fakultas Teknik",
        major: "Teknik Elektro",
        school_name: "SMA Negeri 1",
      }),
    );

    expect(status).toBe(400);
    expect(error).toBe(
      "University, department, and major are required for student registrations (or school name if still in school).",
    );
  });

  it("student school path with guardian → 400", async () => {
    const { status, error } = await post(
      validPayload({
        category: "student",
        school_name: "SMA Negeri 1",
        guardian_name: "Ibu Sri",
      }),
    );

    expect(status).toBe(400);
    expect(error).toBe(
      "University, department, and major are required for student registrations (or school name if still in school).",
    );
  });

  it("kids missing guardian → 400", async () => {
    const { status, error } = await post(validPayload({ category: "kids" }));

    expect(status).toBe(400);
    expect(error).toBe(
      "Parent or guardian name is required for kids registrations.",
    );
  });

  it("kids with school_name → 400", async () => {
    const { status, error } = await post(
      validPayload({
        category: "kids",
        guardian_name: "Ibu Sri",
        school_name: "SMA Negeri 1",
      }),
    );

    expect(status).toBe(400);
    expect(error).toBe(
      "Parent or guardian name is required for kids registrations.",
    );
  });
});

describe("POST /api/register — length caps", () => {
  it("university over 255 chars → 400", async () => {
    const { status, error } = await post(
      validPayload({
        category: "student",
        university: "a".repeat(256),
        faculty: "Fakultas Teknik",
        major: "Teknik Elektro",
      }),
    );

    expect(status).toBe(400);
    expect(error).toContain("University is too long");
  });

  it("school_name over 255 chars → 400", async () => {
    const { status, error } = await post(
      validPayload({ category: "student", school_name: "a".repeat(256) }),
    );

    expect(status).toBe(400);
    expect(error).toContain("School name is too long");
  });

  it("guardian_name over 100 chars → 400", async () => {
    const { status, error } = await post(
      validPayload({ category: "kids", guardian_name: "a".repeat(101) }),
    );

    expect(status).toBe(400);
    expect(error).toContain("Guardian name is too long");
  });

  it("faculty over 100 chars → 400", async () => {
    const { status, error } = await post(
      validPayload({
        category: "student",
        university: "UI",
        faculty: "a".repeat(101),
        major: "Teknik Elektro",
      }),
    );

    expect(status).toBe(400);
    expect(error).toContain("Faculty is too long");
  });

  it("major over 100 chars → 400", async () => {
    const { status, error } = await post(
      validPayload({
        category: "student",
        university: "UI",
        faculty: "Fakultas Teknik",
        major: "a".repeat(101),
      }),
    );

    expect(status).toBe(400);
    expect(error).toContain("Major is too long");
  });
});
