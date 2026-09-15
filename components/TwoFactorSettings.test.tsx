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

async function clickManage() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "twofa_manage" }));
}

describe("TwoFactorSettings", () => {
  it("enabled=true: Manage goes straight to the disable panel without enrolling", async () => {
    render(<TwoFactorSettings lang="en" enabled={true} />);

    expect(screen.getByText("twofa_status_enabled")).toBeVisible();

    await clickManage();

    expect(
      await screen.findByRole("button", { name: "twofa_disable_button" }),
    ).toBeVisible();
    expect(enrollMock).not.toHaveBeenCalled();
  });

  it("enabled=false: Manage enrolls and shows the QR + confirm form", async () => {
    enrollMock.mockResolvedValue({
      ok: true,
      secret: "JBSWY3DPEHPK3PXP",
      otpauthUrl: "otpauth://totp/Tenkei%20Aikidojo:member@dojo.example",
    });
    render(<TwoFactorSettings lang="en" enabled={false} />);

    expect(screen.queryByText("twofa_status_enabled")).toBeNull();
    await clickManage();

    expect(await screen.findByText("twofa_setup_scan")).toBeVisible();
    // QR renders as an accessible image with the setup-key label.
    expect(screen.getByRole("img", { name: "twofa_qr_alt" })).toBeVisible();
    expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "twofa_confirm_button" }),
    ).toBeVisible();
    expect(enrollMock).toHaveBeenCalledTimes(1);
  });

  it("enabled=false: enroll 404 (kill switch off) hides the section", async () => {
    enrollMock.mockResolvedValue({ ok: false, status: 404 });
    const { container } = render(
      <TwoFactorSettings lang="en" enabled={false} />,
    );

    await clickManage();

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
