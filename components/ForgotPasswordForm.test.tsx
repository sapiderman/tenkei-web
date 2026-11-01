// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";

// The real form hides the Turnstile widget when no site key is configured —
// provide one so the (mocked) widget mounts and mints a token.
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";

vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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

const forgotPasswordMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  forgotPassword: (...args: unknown[]) => forgotPasswordMock(...args),
}));

import ForgotPasswordForm from "./ForgotPasswordForm";

beforeEach(() => {
  forgotPasswordMock.mockReset();
  return () => cleanup();
});

async function submitEmail(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("email_label"), "user@test.com");
  await user.click(
    screen.getByRole("button", { name: "forgot_password_button" }),
  );
}

describe("ForgotPasswordForm", () => {
  it("shows the generic confirmation on success", async () => {
    forgotPasswordMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ForgotPasswordForm lang="en" />);

    await submitEmail(user);

    expect(await screen.findByText("forgot_password_success")).toBeVisible();
    const [email, token] = forgotPasswordMock.mock.calls[0] as string[];
    expect(email).toBe("user@test.com");
    expect(token).toBe("mock-token-abcdefghijklmnopqrst");
  });

  it("429 surfaces the rate-limit message with retry minutes", async () => {
    forgotPasswordMock.mockResolvedValue({
      ok: false,
      error: "slow down",
      status: 429,
      retryAfterSeconds: 300,
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm lang="en" />);

    await submitEmail(user);

    expect(await screen.findByText("login_rate_limited")).toBeVisible();
  });

  it("other failures show the generic error", async () => {
    forgotPasswordMock.mockResolvedValue({
      ok: false,
      error: "boom",
      status: 500,
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm lang="en" />);

    await submitEmail(user);

    expect(await screen.findByText("forgot_password_error")).toBeVisible();
  });

  it("a thrown network error shows the generic error", async () => {
    forgotPasswordMock.mockRejectedValue(new Error("net"));
    const user = userEvent.setup();
    render(<ForgotPasswordForm lang="en" />);

    await submitEmail(user);

    expect(await screen.findByText("forgot_password_error")).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "forgot_password_button" }),
      ).toBeEnabled(),
    );
  });
});
