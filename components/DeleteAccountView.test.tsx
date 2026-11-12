// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

const getProfileMock = vi.fn();
const requestDeletionCodeMock = vi.fn();
const deleteAccountMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  getProfile: (...args: unknown[]) => getProfileMock(...args),
  requestDeletionCode: (...args: unknown[]) => requestDeletionCodeMock(...args),
  deleteAccount: (...args: unknown[]) => deleteAccountMock(...args),
  logout: vi.fn(),
}));

import DeleteAccountView from "./DeleteAccountView";

const PROFILE_2FA: ProfileResponse = {
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

const PROFILE_EMAIL: ProfileResponse = { ...PROFILE_2FA, totp_enabled: false };

beforeEach(() => {
  getProfileMock.mockReset();
  requestDeletionCodeMock.mockReset();
  deleteAccountMock.mockReset();
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
});

afterEach(cleanup);

/** Types the code, opens the modal, and returns the modal's confirm button. */
async function armModal(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("delete_code_label"), "123456");
  await user.click(screen.getByRole("button", { name: "delete_button" }));
  return screen.getByRole("button", { name: "delete_confirm_yes" });
}

describe("DeleteAccountView", () => {
  it("2FA branch: modal gates the delete — cancel fires nothing, confirm deletes and redirects to the farewell homepage", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: PROFILE_2FA });
    deleteAccountMock.mockResolvedValue({ ok: true, status: 200 });
    render(<DeleteAccountView lang="en" />);

    // No email-code step for 2FA users.
    expect(
      screen.queryByRole("button", { name: "delete_send_code" }),
    ).toBeNull();

    const user = userEvent.setup();
    await armModal(user);

    expect(screen.getByText("delete_confirm_title")).toBeVisible();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(deleteAccountMock).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "delete_confirm_cancel" }),
    );
    expect(screen.queryByText("delete_confirm_title")).toBeNull();
    expect(deleteAccountMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "delete_button" }));
    await user.click(
      screen.getByRole("button", { name: "delete_confirm_yes" }),
    );
    expect(deleteAccountMock).toHaveBeenCalledWith("123456");

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/en?deleted=1"),
    );
  });

  it("email branch: send code reveals the code input, then the full flow works", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: PROFILE_EMAIL });
    requestDeletionCodeMock.mockResolvedValue({ ok: true, status: 200 });
    deleteAccountMock.mockResolvedValue({ ok: true, status: 200 });
    render(<DeleteAccountView lang="en" />);

    const user = userEvent.setup();
    // Input hidden until the code is on its way.
    expect(screen.queryByLabelText("delete_code_label")).toBeNull();

    await user.click(
      await screen.findByRole("button", { name: "delete_send_code" }),
    );
    expect(requestDeletionCodeMock).toHaveBeenCalledTimes(1);

    const confirm = await armModal(user);
    expect(
      screen.getByRole("button", { name: "delete_code_sent" }),
    ).toBeDisabled();
    await user.click(confirm);
    expect(deleteAccountMock).toHaveBeenCalledWith("123456");
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/en?deleted=1"),
    );
  });

  it("400 shows the inline invalid-code error and keeps the input", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: PROFILE_2FA });
    deleteAccountMock.mockResolvedValue({ ok: false, status: 400 });
    render(<DeleteAccountView lang="en" />);

    const user = userEvent.setup();
    await user.click(await armModal(user));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "delete_error_invalid_code",
    );
    expect(screen.getByLabelText("delete_code_label")).toBeVisible();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("429 on the send step shows the inline rate-limit message", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: PROFILE_EMAIL });
    requestDeletionCodeMock.mockResolvedValue({ ok: false, status: 429 });
    render(<DeleteAccountView lang="en" />);

    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "delete_send_code" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "delete_error_rate_limited",
    );
    expect(screen.queryByLabelText("delete_code_label")).toBeNull();
  });

  it("401 on delete redirects to login with ?expired=1", async () => {
    getProfileMock.mockResolvedValue({ ok: true, profile: PROFILE_2FA });
    deleteAccountMock.mockResolvedValue({ ok: false, status: 401 });
    render(<DeleteAccountView lang="en" />);

    const user = userEvent.setup();
    await user.click(await armModal(user));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/en/login?expired=1"),
    );
  });

  it("401 on profile load redirects to login with ?expired=1", async () => {
    getProfileMock.mockResolvedValue({ ok: false, status: 401 });
    render(<DeleteAccountView lang="en" />);

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/en/login?expired=1"),
    );
  });
});
