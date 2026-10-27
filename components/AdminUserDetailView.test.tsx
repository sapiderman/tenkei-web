// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import type { ProfileResponse } from "@/lib/types";

// i18n: t() returns the key — assertions match on key names.
vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Stable identity mirrors production useRouter (memoized) — a fresh object per call would re-fire the [id, lang, router] hydration effect mid-test.
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

const adminGetUserMock = vi.fn();
const adminUpdateUserMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  adminGetUser: (...args: unknown[]) => adminGetUserMock(...args),
  adminUpdateUser: (...args: unknown[]) => adminUpdateUserMock(...args),
  adminVerifyUser: vi.fn(),
  adminChangeRole: vi.fn(),
}));

import AdminUserDetailView from "./AdminUserDetailView";

const STUDENT_PROFILE: ProfileResponse = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  whatsapp: "",
  dojo: "Tenkei Mayapada",
  faculty: "Fakultas Teknik",
  major: "Teknik Elektro",
  category: "student",
  university: "Universitas Indonesia",
  school_name: "",
  guardian_name: "",
  rank: "",
  date_of_birth: "",
  join_date: "2024-06-01",
  last_grading_date: "",
  role: "user",
  consent_datastore: true,
  consent_marketing: false,
  medical_conditions: "",
  emergency_contact_name: "",
  emergency_contact_number: "",
};

const REGULAR_PROFILE: ProfileResponse = {
  ...STUDENT_PROFILE,
  faculty: "",
  major: "",
  category: "regular",
  university: "",
};

beforeEach(() => {
  adminGetUserMock.mockReset();
  adminUpdateUserMock.mockReset();
  return () => cleanup();
});

describe("AdminUserDetailView category block", () => {
  it("switching to regular clears the block and submits empty strings", async () => {
    adminGetUserMock.mockResolvedValue({ ok: true, profile: STUDENT_PROFILE });
    adminUpdateUserMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<AdminUserDetailView lang="en" id="1" />);

    const university = await screen.findByLabelText(/university/);
    expect(university).toHaveValue("Universitas Indonesia");
    expect(screen.getByLabelText(/^faculty/)).toHaveValue("Fakultas Teknik");
    expect(screen.getByLabelText(/^major/)).toHaveValue("Teknik Elektro");

    await user.click(screen.getByRole("radio", { name: "category_regular" }));

    // The cleared block is gone from the UI — clearing is submitted as-is.
    expect(screen.queryByLabelText(/university/)).toBeNull();
    expect(screen.queryByLabelText(/^faculty/)).toBeNull();
    expect(screen.queryByLabelText(/^major/)).toBeNull();
    expect(screen.queryByLabelText(/school_name/)).toBeNull();
    expect(screen.queryByLabelText(/guardian_name/)).toBeNull();

    await user.click(screen.getByRole("button", { name: "admin_save" }));

    await waitFor(() => expect(adminUpdateUserMock).toHaveBeenCalledOnce());
    const payload = adminUpdateUserMock.mock.calls[0][1] as Record<
      string,
      unknown
    >;
    expect(payload).toMatchObject({
      category: "regular",
      university: "",
      faculty: "",
      major: "",
      school_name: "",
      guardian_name: "",
    });
  });

  it("a server 400 surfaces as a form error", async () => {
    adminGetUserMock.mockResolvedValue({ ok: true, profile: REGULAR_PROFILE });
    adminUpdateUserMock.mockResolvedValue({
      ok: false,
      status: 400,
      error: "fields do not match the selected category",
    });
    const user = userEvent.setup();
    render(<AdminUserDetailView lang="en" id="1" />);

    await screen.findByLabelText(/full_name/);
    await user.click(screen.getByRole("button", { name: "admin_save" }));

    expect(
      await screen.findByText("fields do not match the selected category"),
    ).toBeVisible();
  });
});
