// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
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

// Tested separately — TwoFactorView only forwards `enabled`.
vi.mock("@/components/TwoFactorSettings", () => ({
  default: ({ enabled }: { enabled?: boolean }) => (
    <div>{enabled ? "twofa-probe-enabled" : "twofa-probe-disabled"}</div>
  ),
}));

const getProfileMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  getProfile: (...args: unknown[]) => getProfileMock(...args),
  logout: vi.fn(),
}));

import TwoFactorView from "./TwoFactorView";

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
  totp_enabled: true,
};

beforeEach(() => {
  getProfileMock.mockReset();
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
});

afterEach(cleanup);

describe("TwoFactorView", () => {
  it("renders the 2FA page with the enabled state from the profile", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: PROFILE });
    render(<TwoFactorView lang="en" />);

    expect(await screen.findByText("twofa-probe-enabled")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "twofa_title" }),
    ).toHaveAttribute("href", "/en/profile/twofactor");
  });

  it("401 redirects to login with ?expired=1", async () => {
    getProfileMock.mockResolvedValue({ ok: false, status: 401 });
    render(<TwoFactorView lang="en" />);

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/en/login?expired=1"),
    );
  });

  it("load failure shows the error panel", async () => {
    getProfileMock.mockResolvedValue({ ok: false, status: 500 });
    render(<TwoFactorView lang="en" />);

    expect(await screen.findByText("profile_load_failed")).toBeVisible();
  });
});
