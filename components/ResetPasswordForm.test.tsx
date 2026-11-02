// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockRouter = { push: vi.fn(), replace: vi.fn() };
// Override per test to simulate a missing/invalid ?token=.
const searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => searchParams,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const resetPasswordMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  resetPassword: (...args: unknown[]) => resetPasswordMock(...args),
}));

import ResetPasswordForm from "./ResetPasswordForm";

beforeEach(() => {
  searchParams.set("token", "tok123");
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  resetPasswordMock.mockReset();
  return () => cleanup();
});

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  password: string,
  confirm = password,
) {
  await user.type(screen.getByLabelText("new_password"), password);
  await user.type(screen.getByLabelText("confirm_new_password"), confirm);
  await user.click(
    screen.getByRole("button", { name: "reset_password_button" }),
  );
}

describe("ResetPasswordForm", () => {
  it("no token in the URL → invalid-link state, no form", () => {
    searchParams.delete("token");
    render(<ResetPasswordForm lang="en" />);

    expect(screen.getByText("reset_password_invalid_token")).toBeVisible();
    expect(screen.queryByLabelText("new_password")).toBeNull();
  });

  it("server token error (expired) → invalid-link state with the request-new link", async () => {
    resetPasswordMock.mockResolvedValue({
      ok: false,
      error: "expired",
      status: 400,
      code: "expired_token",
    });
    const user = userEvent.setup();
    render(<ResetPasswordForm lang="en" />);

    await fillAndSubmit(user, "longenough1");

    expect(
      await screen.findByText("reset_password_invalid_token"),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "reset_password_request_new" }),
    ).toHaveAttribute("href", "/en/forgot-password");
  });

  it("success redirects to login with ?reset=1", async () => {
    resetPasswordMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ResetPasswordForm lang="en" />);

    await fillAndSubmit(user, "longenough1");

    expect(resetPasswordMock).toHaveBeenCalledWith("tok123", "longenough1");
    expect(mockRouter.replace).toHaveBeenCalledWith("/en/login?reset=1");
  });

  it("password mismatch blocks submission", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm lang="en" />);

    await fillAndSubmit(user, "longenough1", "longenough2");

    expect(await screen.findByText("error_password_mismatch")).toBeVisible();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("short password blocks submission", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm lang="en" />);

    await fillAndSubmit(user, "short");

    expect(await screen.findByText("error_password_too_short")).toBeVisible();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("429 surfaces the rate-limit message, the link stays good", async () => {
    resetPasswordMock.mockResolvedValue({
      ok: false,
      error: "slow down",
      status: 429,
      retryAfterSeconds: 60,
    });
    const user = userEvent.setup();
    render(<ResetPasswordForm lang="en" />);

    await fillAndSubmit(user, "longenough1");

    expect(await screen.findByText("login_rate_limited")).toBeVisible();
    // Still on the form — not the invalid-link state.
    expect(screen.getByLabelText("new_password")).toBeVisible();
  });
});
