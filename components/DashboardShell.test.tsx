// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const { pushMock, replaceMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
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

vi.mock("@/lib/api-client", () => ({ logout: vi.fn() }));

import DashboardShell from "./DashboardShell";

afterEach(cleanup);

describe("DashboardShell", () => {
  it("offers two-factor authentication in the left menu", () => {
    render(
      <DashboardShell lang="en" role="user" active="profile">
        <p>content</p>
      </DashboardShell>,
    );
    expect(screen.getByRole("link", { name: "twofa_title" })).toHaveAttribute(
      "href",
      "/en/profile/twofactor",
    );
  });

  it("offers account deletion in the left menu for every member", () => {
    render(
      <DashboardShell lang="en" role="user" active="profile">
        <p>content</p>
      </DashboardShell>,
    );
    expect(
      screen.getByRole("link", { name: "delete_account_nav" }),
    ).toHaveAttribute("href", "/en/profile/delete");
  });

  it("signs out with replace so Back cannot restore the portal", async () => {
    const user = userEvent.setup();
    render(
      <DashboardShell lang="en" role="user" active="profile">
        <p>content</p>
      </DashboardShell>,
    );

    await user.click(screen.getByRole("button", { name: "sign_out" }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/en"));
    expect(pushMock).not.toHaveBeenCalled();
  });
});
