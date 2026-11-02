// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import type { ProfileResponse } from "@/lib/types";

vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockRouter = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
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

// Tested separately — ProfileView only forwards `enabled`.
vi.mock("@/components/TwoFactorSettings", () => ({
  default: () => null,
}));

const getProfileMock = vi.fn();
const logoutMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  getProfile: (...args: unknown[]) => getProfileMock(...args),
  logout: (...args: unknown[]) => logoutMock(...args),
}));

import ProfileView from "./ProfileView";

const PROFILE: ProfileResponse = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  whatsapp: "08123456789",
  dojo: "Tenkei Mayapada",
  category: "regular",
  rank: "6 kyu",
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

beforeEach(() => {
  getProfileMock.mockReset();
  logoutMock.mockReset();
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  return () => cleanup();
});

describe("ProfileView", () => {
  it("renders the profile fields", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: PROFILE });
    render(<ProfileView lang="en" />);

    expect(await screen.findByText("Test User")).toBeVisible();
    expect(screen.getByText("Tenkei Mayapada")).toBeVisible();
    expect(screen.getByText("profile_heading")).toBeVisible();
  });

  it("empty values render as an em dash", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: PROFILE });
    render(<ProfileView lang="en" />);

    await screen.findByText("Test User");
    // Several fields are empty in PROFILE (dob, medical, emergency, …).
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("401 redirects to login with ?expired=1", async () => {
    getProfileMock.mockResolvedValue({ ok: false, status: 401 });
    render(<ProfileView lang="en" />);

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/en/login?expired=1"),
    );
  });

  it("load failure shows the error panel", async () => {
    getProfileMock.mockResolvedValue({ ok: false, status: 500 });
    render(<ProfileView lang="en" />);

    expect(await screen.findByText("profile_load_failed")).toBeVisible();
  });

  it("saved=true shows the dismissible banner", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: PROFILE });
    const user = userEvent.setup();
    render(<ProfileView lang="en" saved />);

    expect(await screen.findByText("profile_saved")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "dismiss" }));
    expect(screen.queryByText("profile_saved")).toBeNull();
  });

  it("pending members see the verification notice", async () => {
    getProfileMock.mockResolvedValue({
      ok: true,
      profile: { ...PROFILE, role: "new" },
    });
    render(<ProfileView lang="en" />);

    expect(await screen.findByText("admin_pending_notice")).toBeVisible();
  });

  it("admins get the manage-members link", async () => {
    getProfileMock.mockResolvedValue({
      ok: true,
      profile: { ...PROFILE, role: "admin" },
    });
    render(<ProfileView lang="en" />);

    expect(
      await screen.findByRole("link", { name: "admin_manage_users" }),
    ).toHaveAttribute("href", "/en/admin/users");
  });

  it("logout calls the API and navigates home", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: PROFILE });
    logoutMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ProfileView lang="en" />);

    await screen.findByText("Test User");
    await user.click(screen.getByRole("button", { name: "sign_out" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledOnce());
    expect(mockRouter.push).toHaveBeenCalledWith("/en");
  });
});
