// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import type { UserSummary } from "@/lib/types";

// Stable t identity: AdminUsersView lists `t` in its fetch effect deps.
const mockT = (key: string) => key;
vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: mockT }),
}));

// Stable identity mirrors production useRouter (memoized) — a fresh object per call re-fires effects listing `router` in deps.
const mockRouter = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/app/[lang]/admin/AdminRoleContext", () => ({
  useAdminRole: () => "admin",
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

const adminListUsersMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  adminListUsers: (...args: unknown[]) => adminListUsersMock(...args),
  logout: vi.fn(),
}));

import AdminUsersView from "./AdminUsersView";

const MEMBER: UserSummary = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  whatsapp: "",
  dojo: "Tenkei Mayapada",
  category: "student",
  role: "user",
};

beforeEach(() => {
  adminListUsersMock.mockReset();
  return () => cleanup();
});

describe("AdminUsersView category badge", () => {
  it("renders the category chip from the summary", async () => {
    adminListUsersMock.mockResolvedValue({
      ok: true,
      data: { members: [MEMBER], total: 1, page: 1, size: 25 },
    });
    render(<AdminUsersView lang="en" />);

    const badge = await screen.findByText("category_student");
    expect(badge).toBeVisible();
    expect(badge).toHaveClass("bg-blue-100");
  });

  it("falls back to the neutral chip for an unknown category", async () => {
    adminListUsersMock.mockResolvedValue({
      ok: true,
      data: {
        members: [{ ...MEMBER, category: "alumni" }],
        total: 1,
        page: 1,
        size: 25,
      },
    });
    render(<AdminUsersView lang="en" />);

    const badge = await screen.findByText("category_alumni");
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).not.toHaveClass("bg-blue-100");
    expect(badge).not.toHaveClass("bg-purple-100");
  });
});
