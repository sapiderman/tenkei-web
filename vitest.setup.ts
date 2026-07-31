import { vi, beforeEach } from "vitest";

// Default: a sane stub tests override with vi.stubGlobal("fetch", ...).
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 200 })),
  );
});
