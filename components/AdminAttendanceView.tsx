"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import { useAdminRole } from "@/app/[lang]/admin/AdminRoleContext";
import DashboardShell from "@/components/DashboardShell";
import { DOJO_OPTIONS } from "@/lib/constants";
import {
  adminConfirmAttendance,
  adminListAttendance,
  adminRejectAttendance,
} from "@/lib/api-client";
import { formatDate, formatTime } from "@/lib/datetime";
import {
  ATTENDANCE_STATUS_CHIP,
  type AdminAttendanceRecord,
  type AttendanceStatus,
} from "@/lib/types";

const PAGE_SIZES = [10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 300;

export default function AdminAttendanceView({ lang }: { lang: string }) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();
  const role = useAdminRole();

  const [items, setItems] = useState<AdminAttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [dojo, setDojo] = useState("");
  const [status, setStatus] = useState<AttendanceStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Debounce the search box so typing a name is one request, not ten.
  useEffect(() => {
    const next = searchInput.trim();
    if (next === q) return;
    const timer = setTimeout(() => {
      setQ(next);
      setPage(1);
      setLoading(true);
      setError(null);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await adminListAttendance({
        page,
        size,
        dojo,
        status,
        from,
        to,
        q,
      });
      if (cancelled) return;
      if (result.ok) {
        setItems(result.data.items);
        setTotal(result.data.total);
      } else if (result.status === 401) {
        router.replace(`/${lang}/login?expired=1`);
      } else {
        setError(t("attendance_load_failed"));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, size, dojo, status, from, to, q, refresh, lang, router, t]);

  // Any filter change restarts the list from page 1.
  function changeFilter(apply: () => void) {
    apply();
    setPage(1);
    setLoading(true);
    setError(null);
  }

  // Always refetch afterwards: a 409 means another admin decided it first.
  async function decide(rec: AdminAttendanceRecord, confirm: boolean) {
    setBusyId(rec.id);
    setActionError(null);
    const result = confirm
      ? await adminConfirmAttendance(rec.id)
      : await adminRejectAttendance(rec.id);
    setBusyId(null);
    if (!result.ok) {
      setActionError(
        t(
          result.status === 409
            ? "attendance_already_decided"
            : result.status === 404
              ? "attendance_not_found"
              : "attendance_decide_failed",
        ),
      );
    }
    setRefresh((n) => n + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / size));
  const chip = (s: AttendanceStatus) =>
    `inline-block rounded-full px-2 py-0.5 text-xs ${ATTENDANCE_STATUS_CHIP[s]}`;

  return (
    <DashboardShell lang={lang} role={role} active="adminAttendance">
      <div className="w-full">
        <h1 className="mb-6 text-2xl font-bold">
          {t("admin_attendance_page_title")}
        </h1>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("attendance_search_placeholder")}
            aria-label={t("attendance_col_member")}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 sm:w-48 sm:flex-none"
          />
          <select
            value={dojo}
            onChange={(e) => changeFilter(() => setDojo(e.target.value))}
            aria-label={t("attendance_dojo")}
            className={"\"rounded-md border border-gray-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500\""}
          >
            <option value="">{t("attendance_filter_dojo_all")}</option>
            {DOJO_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) =>
              changeFilter(() =>
                setStatus(e.target.value as AttendanceStatus | ""),
              )
            }
            aria-label={t("attendance_col_status")}
            className={"\"rounded-md border border-gray-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500\""}
          >
            <option value="">{t("attendance_filter_status_all")}</option>
            <option value="pending">{t("attendance_status_pending")}</option>
            <option value="confirmed">
              {t("attendance_status_confirmed")}
            </option>
            <option value="rejected">{t("attendance_status_rejected")}</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <span>{t("attendance_filter_from")}</span>
            <input
              type="date"
              value={from}
              onChange={(e) => changeFilter(() => setFrom(e.target.value))}
              className={"\"rounded-md border border-gray-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500\""}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <span>{t("attendance_filter_to")}</span>
            <input
              type="date"
              value={to}
              onChange={(e) => changeFilter(() => setTo(e.target.value))}
              className={"\"rounded-md border border-gray-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500\""}
            />
          </label>
          <select
            value={size}
            onChange={(e) => changeFilter(() => setSize(Number(e.target.value)))}
            aria-label={t("admin_page_size")}
            className={"\"rounded-md border border-gray-300 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500\""}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {actionError && (
          <div
            className="mb-4 rounded-sm border border-red-300 bg-red-50 p-3 text-red-700"
            role="alert"
            aria-live="polite"
          >
            {actionError}
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
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-gray-500">
            {t("attendance_no_results")}
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
                      {t("attendance_col_member")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("attendance_dojo")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("attendance_instructor")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("attendance_col_location")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("attendance_col_status")}
                    </th>
                    <th className="py-2 font-medium">
                      {t("attendance_col_actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((rec) => {
                    const located =
                      rec.has_location &&
                      rec.latitude != null &&
                      rec.longitude != null;
                    return (
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
                        <td className="py-2 pr-3 text-gray-700">
                          {rec.user_name}
                        </td>
                        <td className="py-2 pr-3 text-gray-700">{rec.dojo}</td>
                        <td className="py-2 pr-3 text-gray-700">
                          {rec.instructor}
                        </td>
                        <td className="py-2 pr-3 text-gray-700">
                          {located ? (
                            <>
                              <a
                                href={`https://maps.google.com/?q=${rec.latitude},${rec.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800"
                              >
                                {t("attendance_location_map")}
                              </a>
                              {rec.location_accuracy_m != null && (
                                <span className="text-xs text-gray-500">
                                  {" "}
                                  ±{rec.location_accuracy_m} m
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {t("attendance_no_location")}
                            </span>
                          )}
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
                        <td className="py-2 text-right whitespace-nowrap">
                          {rec.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => decide(rec, true)}
                                disabled={busyId === rec.id}
                                className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {t("attendance_confirm")}
                              </button>
                              <button
                                type="button"
                                onClick={() => decide(rec, false)}
                                disabled={busyId === rec.id}
                                className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {t("attendance_reject")}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

        <p className="mt-8 text-center text-xs text-gray-400">
          {t(`admin_role_${role}`)}
        </p>
      </div>
    </DashboardShell>
  );
}
