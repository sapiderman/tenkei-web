// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";

const mockT = (key: string) => key;
vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: mockT }),
}));

const mockRouter = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));

vi.mock("@/app/[lang]/admin/AdminRoleContext", () => ({
  useAdminRole: () => "admin",
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const api = vi.hoisted(() => ({
  adminListAttendance: vi.fn(),
  adminConfirmAttendance: vi.fn(),
  adminRejectAttendance: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("@/lib/api-client", () => api);

import AdminAttendanceView from "./AdminAttendanceView";
import type { AdminAttendanceRecord } from "@/lib/types";

const row = (over: Partial<AdminAttendanceRecord> = {}): AdminAttendanceRecord => ({
  id: 5,
  user_id: 7,
  user_name: "Eka",
  logged_at: "2026-11-26T01:02:03Z",
  dojo: "Tenkei Mayapada",
  instructor: "TBD",
  has_location: false,
  location_accuracy_m: null,
  latitude: null,
  longitude: null,
  status: "pending",
  confirmed_by_name: null,
  confirmed_at: null,
  ...over,
});

const listed = (items: AdminAttendanceRecord[]) => ({
  ok: true,
  data: { items, total: items.length, page: 1, size: 25 },
});

beforeEach(() => {
  vi.clearAllMocks();
  api.adminListAttendance.mockResolvedValue(listed([]));
});

afterEach(cleanup);

describe("AdminAttendanceView", () => {
  it("shows a No location badge and links to a map when coordinates exist", async () => {
    api.adminListAttendance.mockResolvedValue(
      listed([
        row(),
        row({
          id: 6,
          user_name: "Sari",
          has_location: true,
          latitude: -6.2,
          longitude: 106.8,
          location_accuracy_m: 15,
        }),
      ]),
    );
    render(<AdminAttendanceView lang="en" />);

    expect(await screen.findByText("attendance_no_location")).toBeInTheDocument();
    const map = screen.getByRole("link", { name: "attendance_location_map" });
    expect(map).toHaveAttribute("href", "https://maps.google.com/?q=-6.2,106.8");
    expect(map).toHaveAttribute("target", "_blank");
    expect(screen.getByText("±15 m")).toBeInTheDocument();
  });

  it("confirms a pending record and refetches", async () => {
    const user = userEvent.setup();
    api.adminListAttendance.mockResolvedValue(listed([row()]));
    api.adminConfirmAttendance.mockResolvedValue({ ok: true });
    render(<AdminAttendanceView lang="en" />);

    await user.click(await screen.findByRole("button", { name: "attendance_confirm" }));
    expect(api.adminConfirmAttendance).toHaveBeenCalledWith(5);
    expect(api.adminRejectAttendance).not.toHaveBeenCalled();
    await waitFor(() => expect(api.adminListAttendance).toHaveBeenCalledTimes(2));
  });

  it("rejects with the record id", async () => {
    const user = userEvent.setup();
    api.adminListAttendance.mockResolvedValue(listed([row()]));
    api.adminRejectAttendance.mockResolvedValue({ ok: true });
    render(<AdminAttendanceView lang="en" />);

    await user.click(await screen.findByRole("button", { name: "attendance_reject" }));
    expect(api.adminRejectAttendance).toHaveBeenCalledWith(5);
  });

  it("explains a 409 and still refreshes the list", async () => {
    const user = userEvent.setup();
    api.adminListAttendance.mockResolvedValue(listed([row()]));
    api.adminConfirmAttendance.mockResolvedValue({ ok: false, status: 409, error: "" });
    render(<AdminAttendanceView lang="en" />);

    await user.click(await screen.findByRole("button", { name: "attendance_confirm" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "attendance_already_decided",
    );
    await waitFor(() => expect(api.adminListAttendance).toHaveBeenCalledTimes(2));
  });

  it("passes every filter to the list call", async () => {
    const user = userEvent.setup();
    render(<AdminAttendanceView lang="en" />);
    await screen.findByText("attendance_no_results");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "attendance_dojo" }),
      "Tenkei Mayapada",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "attendance_col_status" }),
      "pending",
    );
    await user.type(
      screen.getByRole("searchbox", { name: "attendance_col_member" }),
      "eka",
    );
    await waitFor(() =>
      expect(api.adminListAttendance).toHaveBeenCalledWith({
        page: 1,
        size: 25,
        dojo: "Tenkei Mayapada",
        status: "pending",
        from: "",
        to: "",
        q: "eka",
      }),
    );
  });
});
