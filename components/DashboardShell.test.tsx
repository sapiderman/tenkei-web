// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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
    expect(
      screen.getByRole("link", { name: "twofa_title" }),
    ).toHaveAttribute("href", "/en/profile/twofactor");
  });
});
