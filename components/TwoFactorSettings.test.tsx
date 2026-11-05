// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const enrollMock = vi.fn();
const confirmMock = vi.fn();
const disableMock = vi.fn();
vi.mock("@/lib/api-client", () => ({
  enroll2FA: (...args: unknown[]) => enrollMock(...args),
  confirm2FA: (...args: unknown[]) => confirmMock(...args),
  disable2FA: (...args: unknown[]) => disableMock(...args),
}));

import TwoFactorSettings from "./TwoFactorSettings";

beforeEach(() => {
  enrollMock.mockReset();
  confirmMock.mockReset();
  disableMock.mockReset();
  return () => cleanup();
});

describe("TwoFactorSettings", () => {
  it("enabled=true: shows the disable panel directly, without enrolling", async () => {
    render(<TwoFactorSettings lang="en" enabled={true} />);

    expect(screen.getByText("twofa_status_enabled")).toBeVisible();
    expect(
      await screen.findByRole("button", { name: "twofa_disable_button" }),
    ).toBeVisible();
    expect(enrollMock).not.toHaveBeenCalled();
  });

  it("enabled=false: enrolls on load and shows the QR + confirm form", async () => {
    enrollMock.mockResolvedValue({
      ok: true,
      secret: "JBSWY3DPEHPK3PXP",
      otpauthUrl: "otpauth://totp/Tenkei%20Aikidojo:member@dojo.example",
    });
    render(<TwoFactorSettings lang="en" enabled={false} />);

    expect(screen.queryByText("twofa_status_enabled")).toBeNull();
    // One-click flow: the QR renders without pressing any button first.
    expect(await screen.findByText("twofa_setup_scan")).toBeVisible();
    // QR renders as an accessible image with the setup-key label.
    expect(screen.getByRole("img", { name: "twofa_qr_alt" })).toBeVisible();
    expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "twofa_confirm_button" }),
    ).toBeVisible();
    expect(enrollMock).toHaveBeenCalledTimes(1);
  });

  it("enroll 404 (kill switch off) hides the page", async () => {
    enrollMock.mockResolvedValue({ ok: false, status: 404 });
    const { container } = render(
      <TwoFactorSettings lang="en" enabled={false} />,
    );

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("enroll 409 (already enabled) shows disable panel with enabled badge", async () => {
    enrollMock.mockResolvedValue({ ok: false, status: 409 });
    render(<TwoFactorSettings lang="en" enabled={false} />);

    expect(
      await screen.findByRole("button", { name: "twofa_disable_button" }),
    ).toBeVisible();
    expect(screen.getByText("twofa_status_enabled")).toBeVisible();
  });

  it("disable 404 (kill switch off) hides the page", async () => {
    disableMock.mockResolvedValue({ ok: false, reason: "unavailable" });
    const { container } = render(
      <TwoFactorSettings lang="en" enabled={true} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("twofa_code_label"), "123456");
    await user.type(
      screen.getByLabelText("twofa_current_password"),
      "correct-horse",
    );
    await user.click(
      screen.getByRole("button", { name: "twofa_disable_button" }),
    );

    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(disableMock).toHaveBeenCalledTimes(1);
  });
});
