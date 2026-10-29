import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { cookies } from "next/headers";
import { resolveRole } from "@/lib/server-auth";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

// Minimal cookie store stub — resolveRole only reads "tenkei_session".
function store(session?: string): CookieStore {
  return {
    get: (name: string) =>
      name === "tenkei_session" && session
        ? { name, value: session }
        : undefined,
  } as unknown as CookieStore;
}

const fetchMock = vi.fn();

const ENV_KEYS = ["BE_API_BASE", "CLOUDFLARE_BYPASS_SECRET"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe("resolveRole", () => {
  it("no session cookie → null without fetching", async () => {
    process.env.BE_API_BASE = "https://api.test";
    await expect(resolveRole(store())).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("missing BE_API_BASE → null without fetching", async () => {
    await expect(resolveRole(store("abc"))).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the role string and forwards the session cookie", async () => {
    process.env.BE_API_BASE = "https://api.test/";
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ role: "admin" }), { status: 200 }),
    );
    await expect(resolveRole(store("abc"))).resolves.toBe("admin");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    // Trailing slashes are stripped so no double-slash path.
    expect(url).toBe("https://api.test/v1/auth/profile");
    const headers = init.headers as Headers;
    expect(headers.get("Cookie")).toBe("tenkei_session=abc");
    expect(headers.get("x-cf-bypass")).toBeNull();
    expect(init.cache).toBe("no-store");
  });

  it("sets x-cf-bypass when the secret is configured", async () => {
    process.env.BE_API_BASE = "https://api.test";
    process.env.CLOUDFLARE_BYPASS_SECRET = "shh";
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ role: "user" }), { status: 200 }),
    );
    await expect(resolveRole(store("abc"))).resolves.toBe("user");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Headers).get("x-cf-bypass")).toBe("shh");
  });

  it("non-2xx → null", async () => {
    process.env.BE_API_BASE = "https://api.test";
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    await expect(resolveRole(store("abc"))).resolves.toBeNull();
  });

  it("missing or non-string role → null", async () => {
    process.env.BE_API_BASE = "https://api.test";
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ role: 42 }), { status: 200 }),
    );
    await expect(resolveRole(store("abc"))).resolves.toBeNull();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    await expect(resolveRole(store("abc"))).resolves.toBeNull();
  });

  it("network error → null", async () => {
    process.env.BE_API_BASE = "https://api.test";
    fetchMock.mockRejectedValue(new Error("net"));
    await expect(resolveRole(store("abc"))).resolves.toBeNull();
  });
});
