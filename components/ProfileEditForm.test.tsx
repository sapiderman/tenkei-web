// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import type { ProfileResponse } from "@/lib/types";

// i18n: t() returns the key — assertions match on key names.
vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Stable identity mirrors production useRouter (memoized) — a fresh object per call re-fires the [lang, router] hydration effect mid-test.
const mockRouter = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const getProfileMock = vi.fn();
const updateProfileMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  getProfile: (...args: unknown[]) => getProfileMock(...args),
  updateProfile: (...args: unknown[]) => updateProfileMock(...args),
}));

import ProfileEditForm from "./ProfileEditForm";

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
  getProfileMock.mockReset();
  updateProfileMock.mockReset();
  return () => cleanup();
});

describe("ProfileEditForm category block", () => {
  it("hydrates as student and shows the university fields", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: STUDENT_PROFILE });
    render(<ProfileEditForm lang="en" />);

    const university = await screen.findByLabelText(/university/);
    expect(university).toBeVisible();
    expect(university).toHaveValue("Universitas Indonesia");
    expect(screen.getByLabelText(/profile_faculty/)).toHaveValue(
      "Fakultas Teknik",
    );
    expect(screen.getByLabelText(/profile_major/)).toHaveValue("Teknik Elektro");
    expect(screen.queryByLabelText(/school_name/)).toBeNull();
    expect(screen.queryByLabelText(/guardian_name/)).toBeNull();
    expect(
      screen.getByRole("checkbox", { name: /student_still_in_school/ }),
    ).not.toBeChecked();
  });

  it("switching to regular clears the block and submits empty strings", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: STUDENT_PROFILE });
    updateProfileMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ProfileEditForm lang="en" />);

    await screen.findByLabelText(/university/);
    await user.click(screen.getByRole("radio", { name: "category_regular" }));

    // The cleared block is gone from the UI — clearing is submitted as-is.
    expect(screen.queryByLabelText(/university/)).toBeNull();
    expect(screen.queryByLabelText(/school_name/)).toBeNull();
    expect(screen.queryByLabelText(/guardian_name/)).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "edit_profile_save" }),
    );

    await waitFor(() => expect(updateProfileMock).toHaveBeenCalledOnce());
    const payload = updateProfileMock.mock.calls[0][0] as Record<
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
    getProfileMock.mockResolvedValue({ ok: true, profile: REGULAR_PROFILE });
    updateProfileMock.mockResolvedValue({
      ok: false,
      error: "validation",
      message: "fields do not match the selected category",
    });
    const user = userEvent.setup();
    render(<ProfileEditForm lang="en" />);

    await screen.findByLabelText(/profile_name/);
    await user.click(
      screen.getByRole("button", { name: "edit_profile_save" }),
    );

    expect(
      await screen.findByText("fields do not match the selected category"),
    ).toBeVisible();
  });
});
