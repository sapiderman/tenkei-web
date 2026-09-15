// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

// The real form hides the Turnstile widget when no site key is configured —
// provide one so the (mocked) widget mounts and mints a token.
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";

import "@testing-library/jest-dom/vitest";

// i18n: t() returns the key — assertions match on key names.
vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Turnstile: auto-solve on mount so the form's token guard passes.
vi.mock("@marsidev/react-turnstile", async () => {
  const { useEffect } = await import("react");
  return {
    Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => {
      useEffect(() => {
        onSuccess("mock-token-abcdefghijklmnopqrst");
      }, [onSuccess]);
      return null;
    },
  };
});

const loginMock = vi.fn();
const verifyMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  login: (...args: unknown[]) => loginMock(...args),
  verify2FA: (...args: unknown[]) => verifyMock(...args),
}));

import LoginForm from "./LoginForm";

beforeEach(() => {
  sessionStorage.clear();
  loginMock.mockReset();
  verifyMock.mockReset();
  return () => cleanup();
});

const PENDING_KEY = "tenkei_2fa_pending";

async function submitPasswordForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("identifier"), "user@test.com");
  await user.type(screen.getByLabelText("password"), "hunter2hunter2");
  await user.click(screen.getByRole("button", { name: "login_button" }));
}

describe("LoginForm 2FA step", () => {
  it("shows the code step (and hides the password form) when 2fa is required", async () => {
    loginMock.mockResolvedValue({ ok: true, twoFactorRequired: true });
    render(<LoginForm lang="en" />);

    await submitPasswordForm();

    expect(await screen.findByLabelText("twofa_code_label")).toBeVisible();
    expect(screen.queryByLabelText("password")).toBeNull();
    expect(loginMock).toHaveBeenCalledTimes(1);
  });

  it("invalid code keeps the user on the code step with an error", async () => {
    loginMock.mockResolvedValue({ ok: true, twoFactorRequired: true });
    verifyMock.mockResolvedValue({ ok: false, reason: "invalid" });
    render(<LoginForm lang="en" />);

    await submitPasswordForm();
    await screen.findByLabelText("twofa_code_label");

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("twofa_code_label"), "000000");
    await user.click(
      screen.getByRole("button", { name: "twofa_verify_button" }),
    );

    expect(await screen.findByText("twofa_invalid_code")).toBeVisible();
    expect(screen.getByLabelText("twofa_code_label")).toBeVisible();
    expect(verifyMock).toHaveBeenCalledWith("000000");
  });

  it("lockout (totp_locked) returns the user to the password step", async () => {
    loginMock.mockResolvedValue({ ok: true, twoFactorRequired: true });
    verifyMock.mockResolvedValue({ ok: false, reason: "locked" });
    render(<LoginForm lang="en" />);

    await submitPasswordForm();
    await screen.findByLabelText("twofa_code_label");

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("twofa_code_label"), "999999");
    await user.click(
      screen.getByRole("button", { name: "twofa_verify_button" }),
    );

    expect(await screen.findByText("twofa_locked")).toBeVisible();
    expect(screen.getByLabelText("password")).toBeVisible();
    expect(screen.queryByLabelText("twofa_code_label")).toBeNull();
    // The pending-step flag must be cleared — a later refresh shows step 1.
    expect(sessionStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it("a stored pending flag renders the code step directly on mount", async () => {
    sessionStorage.setItem(PENDING_KEY, "1");
    render(<LoginForm lang="en" />);

    // Flipped in an effect (SSR-safe), so wait for it.
    expect(await screen.findByLabelText("twofa_code_label")).toBeVisible();
    expect(screen.queryByLabelText("password")).toBeNull();
    expect(loginMock).not.toHaveBeenCalled();
  });
});
