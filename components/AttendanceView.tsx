"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import DashboardShell from "@/components/DashboardShell";
import { DOJO_OPTIONS } from "@/lib/constants";
import {
  getInstructors,
  getMyAttendance,
  getProfile,
  logAttendance,
} from "@/lib/api-client";
import { formatDate, formatTime } from "@/lib/datetime";
import {
  ATTENDANCE_STATUS_CHIP,
  type AttendanceRecord,
  type AttendanceStatus,
  type InstructorListResponse,
} from "@/lib/types";

const PAGE_SIZE = 25;
const LOCATION_TIMEOUT_MS = 10_000;

/** Names offered for a dojo: everyone who teaches there plus those who teach everywhere. */
function mergeRoster(list: InstructorListResponse, dojo: string): string[] {
  return [...new Set([...list.all, ...(list.instructors[dojo] ?? [])])].sort();
}

/**
 * Phone location for the admin's confirmation step. Resolves null when
 * denied, unavailable or slow — attendance is still logged (PRD §3 US1).
 */
function getPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
      enableHighAccuracy: true,
      timeout: LOCATION_TIMEOUT_MS,
      maximumAge: 30_000,
    });
  });
}

export default function AttendanceView({
  lang,
  role,
}: {
  lang: string;
  role: string;
}) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dojoSelect = useRef<HTMLSelectElement>(null);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // null until the dialog has loaded the roster, or after a failed load.
  const [instructors, setInstructors] = useState<InstructorListResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [dojo, setDojo] = useState(DOJO_OPTIONS[0]);
  const [instructor, setInstructor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getMyAttendance({ page, size: PAGE_SIZE });
      if (cancelled) return;
      if (result.ok) {
        setRecords(result.data.items);
        setTotal(result.data.total);
      } else if (result.status === 401) {
        router.replace(`/${lang}/login?expired=1`);
      } else {
        setError(
          t(
            result.status === 403
              ? "attendance_not_verified"
              : "attendance_load_failed",
          ),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, refresh, lang, router, t]);

  // The member's own dojo is the default in the dialog (PRD §3 US1).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getProfile();
      if (cancelled || !result.ok) return;
      const own = result.profile.dojo;
      if (DOJO_OPTIONS.includes(own)) setDojo(own);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // showModal() gives the focus trap and backdrop a phone-sized form needs;
  // Esc closes the dialog and onClose keeps `open` in sync.
  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      dojoSelect.current?.focus();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const roster = (d: string) => (instructors ? mergeRoster(instructors, d) : []);

  function pickDojo(next: string) {
    setDojo(next);
    setInstructor(roster(next)[0] ?? "");
  }

  // The roster is fetched on open, so reopening is the retry.
  async function openDialog() {
    setDialogError(null);
    const result = await getInstructors();
    setInstructors(result.ok ? result.data : null);
    setInstructor(result.ok ? (mergeRoster(result.data, dojo)[0] ?? "") : "");
    setOpen(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setDialogError(null);
    const position = await getPosition();
    const result = await logAttendance({
      dojo,
      instructor,
      ...(position && {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        location_accuracy_m: Math.round(position.coords.accuracy),
      }),
    });
    setSubmitting(false);
    if (!result.ok) {
      const key =
        result.status === 409
          ? "attendance_duplicate"
          : result.status === 403
            ? "attendance_not_verified"
            : result.status === 429
              ? "attendance_rate_limited"
              : "attendance_log_failed";
      setDialogError(t(key));
      return;
    }
    setOpen(false);
    setToast(
      t(
        result.record.has_location
          ? "attendance_logged"
          : "attendance_logged_no_location",
      ),
    );
    setPage(1);
    setRefresh((n) => n + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const chip = (status: AttendanceStatus) =>
    `inline-block rounded-full px-2 py-0.5 text-xs ${ATTENDANCE_STATUS_CHIP[status]}`;

  return (
    <DashboardShell lang={lang} role={role} active="attendance">
      <div className="w-full">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t("attendance_heading")}</h1>
          <button
            type="button"
            onClick={openDialog}
            className="rounded-md bg-ai px-4 py-2 text-sm font-medium text-white hover:bg-ai-deep"
          >
            {t("attendance_log_button")}
          </button>
        </div>

        {toast && (
          <div
            className="mb-6 flex items-start justify-between gap-3 rounded-md border border-green-300 bg-green-50 p-3 text-green-800"
            role="status"
            aria-live="polite"
          >
            <p>{toast}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label={t("dismiss")}
              className="shrink-0 text-green-800 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-gray-500">
            {t("attendance_loading")}
          </p>
        ) : error ? (
          <div
            className="rounded-sm border border-red-300 bg-red-50 p-4 text-center text-red-700"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        ) : records.length === 0 ? (
          <p className="py-12 text-center text-gray-500">
            {t("attendance_empty")}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-3 font-medium">
                      {t("attendance_col_date")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("attendance_col_time")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("attendance_dojo")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("attendance_instructor")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("attendance_col_status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr
                      key={rec.id}
                      className="border-b border-gray-100 align-top"
                    >
                      <td className="py-2 pr-3 text-gray-700">
                        {formatDate(rec.logged_at, lang)}
                      </td>
                      <td className="py-2 pr-3 text-gray-700">
                        {formatTime(rec.logged_at, lang)}
                      </td>
                      <td className="py-2 pr-3 text-gray-700">{rec.dojo}</td>
                      <td className="py-2 pr-3 text-gray-700">
                        {rec.instructor}
                      </td>
                      <td className="py-2 pr-3 text-gray-700">
                        <span className={chip(rec.status)}>
                          {t(`attendance_status_${rec.status}`)}
                        </span>
                        {rec.confirmed_by_name && rec.confirmed_at && (
                          <p className="mt-1 text-xs text-gray-500">
                            {t("attendance_confirmed_by", {
                              name: rec.confirmed_by_name,
                              date: formatDate(rec.confirmed_at, lang),
                            })}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className={"\"rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40\""}
                >
                  {t("admin_prev")}
                </button>
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className={"\"rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40\""}
                >
                  {t("admin_next")}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {t("admin_page_of", { page, total: totalPages })}
              </p>
            </div>
          </>
        )}

        <dialog
          ref={dialogRef}
          onClose={() => setOpen(false)}
          aria-labelledby="attendance-dialog-title"
          className="w-full max-w-md rounded-sharp p-0 text-ink backdrop:bg-black/50"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="space-y-4 p-5"
          >
            <h2 id="attendance-dialog-title" className="text-lg font-bold">
              {t("attendance_dialog_title")}
            </h2>
            <label className="block text-sm">
              <span>{t("attendance_dojo")}</span>
              <select
                ref={dojoSelect}
                value={dojo}
                onChange={(e) => pickDojo(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {DOJO_OPTIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            {instructors === null ? (
              <p className="text-sm text-red-700">
                {t("attendance_instructors_load_failed")}
              </p>
            ) : roster(dojo).length === 0 ? (
              <p className="text-sm text-gray-600">
                {t("attendance_instructors_empty")}
              </p>
            ) : (
              <label className="block text-sm">
                <span>{t("attendance_instructor")}</span>
                <select
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {roster(dojo).map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
            )}
            {dialogError && (
              <p role="alert" className="text-sm text-red-700">
                {dialogError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {t("attendance_cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting || !instructor}
                className="rounded-md bg-ai px-4 py-2 text-sm font-medium text-white hover:bg-ai-deep disabled:opacity-60"
              >
                {t(
                  submitting
                    ? "attendance_getting_location"
                    : "attendance_confirm_button",
                )}
              </button>
            </div>
          </form>
        </dialog>
      </div>
    </DashboardShell>
  );
}
