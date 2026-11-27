// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";

const mockT = (key: string) => key;
vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: mockT }),
}));

const mockRouter = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => mockRouter }));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const ROSTER = { all: ["TBD"], instructors: {} };

const api = vi.hoisted(() => ({
  getInstructors: vi.fn(),
  getMyAttendance: vi.fn(),
  getProfile: vi.fn(),
  logAttendance: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("@/lib/api-client", () => api);

import AttendanceView from "./AttendanceView";
import type { AttendanceRecord } from "@/lib/types";

const record = (over: Partial<AttendanceRecord> = {}): AttendanceRecord => ({
  id: 1,
  user_id: 7,
  user_name: "Eka",
  logged_at: "2026-11-26T01:02:03Z",
  dojo: "Tenkei Mayapada",
  instructor: "TBD",
  has_location: true,
  location_accuracy_m: 12,
  status: "pending",
  confirmed_by_name: null,
  confirmed_at: null,
  ...over,
});

const listed = (items: AttendanceRecord[]) => ({
  ok: true,
  data: { items, total: items.length, page: 1, size: 25 },
});

beforeEach(() => {
  vi.clearAllMocks();
  api.getInstructors.mockResolvedValue({ ok: true, data: ROSTER });
  api.getMyAttendance.mockResolvedValue(listed([]));
  api.getProfile.mockResolvedValue({ ok: false, status: 0 });
  // jsdom has <dialog> but no modal API; emulate the open attribute so role
  // queries (and the component's onClose) behave like a browser.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(cleanup);

describe("AttendanceView", () => {
  it("lists my attendance with status and who confirmed it", async () => {
    api.getMyAttendance.mockResolvedValue(
      listed([
        record({ id: 2, status: "confirmed", confirmed_by_name: "Budi", confirmed_at: "2026-11-26T02:00:00Z" }),
        record(),
      ]),
    );
    render(<AttendanceView lang="en" role="user" />);

    const table = await screen.findByRole("table");
    expect(within(table).getAllByText("Tenkei Mayapada")).toHaveLength(2);
    expect(within(table).getByText("attendance_status_confirmed")).toBeInTheDocument();
    expect(screen.getByText("attendance_status_pending")).toBeInTheDocument();
    expect(screen.getByText("attendance_confirmed_by")).toBeInTheDocument();
    expect(api.getMyAttendance).toHaveBeenCalledWith({ page: 1, size: 25 });
  });

  it("defaults the dialog to the member's own dojo", async () => {
    api.getProfile.mockResolvedValue({
      ok: true,
      profile: { dojo: "Tenkei Taman Menteng" },
    });
    const user = userEvent.setup();
    render(<AttendanceView lang="en" role="user" />);
    await waitFor(() => expect(api.getProfile).toHaveBeenCalled());
    await user.click(
      await screen.findByRole("button", { name: "attendance_log_button" }),
    );
    expect(
      await screen.findByRole("combobox", { name: "attendance_dojo" }),
    ).toHaveValue("Tenkei Taman Menteng");
    expect(api.getInstructors).toHaveBeenCalledTimes(1);
  });

  it("logs attendance with the phone location and refreshes the list", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (ok: (p: unknown) => void) =>
          ok({ coords: { latitude: -6.2, longitude: 106.8, accuracy: 10.4 } }),
      },
    });
    api.logAttendance.mockResolvedValue({
      ok: true,
      record: {
        id: 9,
        logged_at: "2026-11-26T03:00:00Z",
        dojo: "Tenkei Mayapada",
        instructor: "TBD",
        status: "pending",
        has_location: true,
      },
    });
    render(<AttendanceView lang="en" role="user" />);

    await user.click(
      await screen.findByRole("button", { name: "attendance_log_button" }),
    );
    await user.selectOptions(
      await screen.findByRole("combobox", { name: "attendance_dojo" }),
      "Tenkei Mayapada",
    );
    await user.click(
      await screen.findByRole("button", { name: "attendance_confirm_button" }),
    );

    await waitFor(() =>
      expect(api.logAttendance).toHaveBeenCalledWith({
        dojo: "Tenkei Mayapada",
        instructor: "TBD",
        latitude: -6.2,
        longitude: 106.8,
        location_accuracy_m: 10,
      }),
    );
    expect(await screen.findByText("attendance_logged")).toBeInTheDocument();
    expect(api.getMyAttendance).toHaveBeenCalledTimes(2);
  });

  it("logs without location when geolocation is denied", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (_ok: unknown, denied: () => void) => denied(),
      },
    });
    api.logAttendance.mockResolvedValue({
      ok: true,
      record: {
        id: 10,
        logged_at: "2026-11-26T03:00:00Z",
        dojo: "Tenkei Universitas Indonesia",
        instructor: "TBD",
        status: "pending",
        has_location: false,
      },
    });
    render(<AttendanceView lang="en" role="user" />);

    await user.click(
      await screen.findByRole("button", { name: "attendance_log_button" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "attendance_confirm_button" }),
    );

    await waitFor(() =>
      expect(api.logAttendance).toHaveBeenCalledWith({
        dojo: "Tenkei Universitas Indonesia",
        instructor: "TBD",
      }),
    );
    expect(await screen.findByText("attendance_logged_no_location")).toBeInTheDocument();
  });

  it("keeps the dialog open with the duplicate message on 409", async () => {
    const user = userEvent.setup();
    api.logAttendance.mockResolvedValue({ ok: false, status: 409 });
    render(<AttendanceView lang="en" role="user" />);

    await user.click(
      await screen.findByRole("button", { name: "attendance_log_button" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "attendance_confirm_button" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "attendance_duplicate",
    );
    expect(screen.getByRole("button", { name: "attendance_cancel" })).toBeInTheDocument();
  });

  it("blocks logging when the dojo has no instructors in the roster", async () => {
    const user = userEvent.setup();
    api.getInstructors.mockResolvedValue({ ok: true, data: { all: [], instructors: {} } });
    render(<AttendanceView lang="en" role="user" />);

    await user.click(
      await screen.findByRole("button", { name: "attendance_log_button" }),
    );
    expect(await screen.findByText("attendance_instructors_empty")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "attendance_instructor" })).toBeNull();
    expect(screen.getByRole("button", { name: "attendance_confirm_button" })).toBeDisabled();
    expect(api.logAttendance).not.toHaveBeenCalled();
  });

  it("offers the shared instructors plus the dojo's own, sorted and deduplicated", async () => {
    const user = userEvent.setup();
    api.getInstructors.mockResolvedValue({
      ok: true,
      data: {
        all: ["Shared Sensei"],
        instructors: { "Tenkei Mayapada": ["Dedi Sensei", "Shared Sensei"] },
      },
    });
    render(<AttendanceView lang="en" role="user" />);
    await user.click(await screen.findByRole("button", { name: "attendance_log_button" }));

    // Default dojo has no dedicated instructors: only the shared one.
    let options = within(await screen.findByRole("combobox", { name: "attendance_instructor" })).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Shared Sensei"]);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "attendance_dojo" }),
      "Tenkei Mayapada",
    );
    const select = screen.getByRole("combobox", { name: "attendance_instructor" }) as HTMLSelectElement;
    options = within(select).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Dedi Sensei", "Shared Sensei"]);
    expect(select.value).toBe("Dedi Sensei");
  });

  it("says so when the roster could not be loaded", async () => {
    const user = userEvent.setup();
    api.getInstructors.mockResolvedValue({ ok: false, status: 500 });
    render(<AttendanceView lang="en" role="user" />);

    await user.click(
      await screen.findByRole("button", { name: "attendance_log_button" }),
    );
    expect(
      await screen.findByText("attendance_instructors_load_failed"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "attendance_confirm_button" })).toBeDisabled();
  });

  it("redirects to login when the session expired", async () => {
    api.getMyAttendance.mockResolvedValue({ ok: false, status: 401 });
    render(<AttendanceView lang="en" role="user" />);
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/en/login?expired=1"),
    );
  });
});
