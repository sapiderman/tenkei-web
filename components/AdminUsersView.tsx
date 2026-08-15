"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/app/i18n/client";
import { useAdminRole } from "@/app/[lang]/admin/AdminRoleContext";
import { adminListUsers, logout } from "@/lib/api-client";
import type { UserSummary } from "@/lib/types";

// Backend caps page size at 100 (default 25). The selector never offers more.
const PAGE_SIZES = [10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 300;

export default function AdminUsersView({ lang }: { lang: string }) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();
  const role = useAdminRole();

  const [members, setMembers] = useState<UserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / size));

  // Debounce the search box into the query param + reset to first page.
  // setState here runs in a timer callback (not the effect body), so it does
  // not trip react-hooks/set-state-in-effect.
  //
  // Guard: only act when the trimmed query actually changed. Without it the
  // mount-time timer fires 300ms in and flips loading back on — after a fast
  // initial fetch (<300ms) already cleared it — and since q/page are
  // unchanged no refetch ever clears loading again (stuck "Loading…").
  useEffect(() => {
    const next = searchInput.trim();
    if (next === q) return;
    const id = setTimeout(() => {
      setQ(next);
      setPage(1);
      setLoading(true);
      setError(null);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput, q]);

  // Fetch whenever a query driver changes. All setState runs after `await`
  // (async continuation), never synchronously in the effect body.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await adminListUsers({
        page,
        size,
        q,
        pending: pendingOnly,
      });
      if (cancelled) return;

      if (result.ok) {
        setMembers(result.data.members);
        setTotal(result.data.total);
        setError(null);
      } else if (result.status === 401) {
        router.replace(`/${lang}/login?expired=1`);
        return;
      } else if (result.status === 403) {
        setError(t("admin_forbidden"));
      } else {
        setError(t("admin_load_failed"));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, size, q, pendingOnly, lang, router, t]);

  async function handleLogout() {
    await logout();
    router.push(`/${lang}`);
  }

  function changeSize(next: number) {
    setSize(next);
    setPage(1);
    setLoading(true);
    setError(null);
  }

  function togglePending(next: boolean) {
    setPendingOnly(next);
    setPage(1);
    setLoading(true);
    setError(null);
  }

  function gotoPage(next: number) {
    setPage(next);
    setLoading(true);
    setError(null);
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t("admin_users_heading")}</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex-shrink-0"
          >
            {t("sign_out")}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("admin_search_placeholder")}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t("admin_search_placeholder")}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => togglePending(e.target.checked)}
              className="h-4 w-4"
            />
            {t("admin_filter_pending")}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            {t("admin_page_size")}
            <select
              value={size}
              onChange={(e) => changeSize(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded-md"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* State */}
        {loading ? (
          <p className="text-gray-500 text-center py-12">
            {t("admin_loading")}
          </p>
        ) : error ? (
          <div
            className="p-4 bg-red-50 border border-red-300 text-red-700 rounded text-center"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        ) : members.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            {t("admin_no_results")}
          </p>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-3 font-medium">
                      {t("admin_col_name")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("admin_col_email")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("admin_col_whatsapp")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("admin_col_dojo")}
                    </th>
                    <th className="py-2 pr-3 font-medium">
                      {t("admin_col_role")}
                    </th>
                    <th className="py-2 font-medium">
                      {t("admin_col_status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((u) => {
                    const pending = u.role === "new";
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-gray-100 align-top"
                      >
                        <td className="py-2 pr-3 text-gray-900">
                          <Link
                            href={`/${lang}/admin/users/${u.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {u.name}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 text-gray-700 break-all">
                          {u.email}
                        </td>
                        <td className="py-2 pr-3 text-gray-700">
                          {u.whatsapp}
                        </td>
                        <td className="py-2 pr-3 text-gray-700">{u.dojo}</td>
                        <td className="py-2 pr-3 text-gray-700">
                          {t(`admin_role_${u.role}`)}
                        </td>
                        <td className="py-2">
                          {pending ? (
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              {t("admin_status_pending")}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                              {t("admin_status_verified")}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => gotoPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t("admin_prev")}
              </button>
              <span className="text-sm text-gray-600">
                {t("admin_page_of", { page, total: totalPages })}
              </span>
              <button
                type="button"
                onClick={() => gotoPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t("admin_next")}
              </button>
            </div>
          </>
        )}

        {/* UX-only role echo (the backend is the authority). */}
        <p className="mt-8 text-center text-xs text-gray-400">
          {t("admin_role_" + role)}
        </p>
      </div>
    </div>
  );
}
