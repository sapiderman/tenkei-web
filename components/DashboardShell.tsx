"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import { logout } from "@/lib/api-client";

/**
 * Left-sidebar shell for every logged-in portal page (profile, profile edit,
 * admin member list/detail). All navigation and account actions live in the
 * sidebar so page content stays focused on the task at hand. `role` is
 * UX-only gating — the backend re-authorizes every request.
 */
export default function DashboardShell({
  lang,
  role,
  active,
  children,
}: {
  lang: string;
  role: string;
  active: "profile" | "edit" | "twofactor" | "delete" | "members";
  children: React.ReactNode;
}) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();

  async function handleLogout() {
    await logout();
    // replace: keep the signed-out portal page out of history so Back can't
    // restore it from bfcache.
    router.replace(`/${lang}`);
  }

  const isAdminLike = role === "admin" || role === "superuser";

  const itemCls = (isActive: boolean) =>
    `whitespace-nowrap rounded-sharp px-3 py-2 text-sm transition-colors ${
      isActive
        ? "bg-ai/10 font-medium text-ai-deep"
        : "text-ink/80 hover:bg-ai/5 hover:text-ai-deep"
    }`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:flex-row md:gap-10 md:p-8">
      <aside className="shrink-0 md:w-56">
        <nav className="flex gap-1 overflow-x-auto rounded-sharp border border-hairline p-1.5 md:sticky md:top-20 md:flex-col md:items-stretch md:border-0 md:p-0">
          <Link
            href={`/${lang}/profile`}
            className={itemCls(active === "profile")}
          >
            {t("my_profile")}
          </Link>
          <Link
            href={`/${lang}/profile/edit`}
            className={itemCls(active === "edit")}
          >
            {t("edit_profile_heading")}
          </Link>
          <Link
            href={`/${lang}/profile/twofactor`}
            className={itemCls(active === "twofactor")}
          >
            {t("twofa_title")}
          </Link>
          <Link
            href={`/${lang}/profile/delete`}
            className={`whitespace-nowrap rounded-sharp px-3 py-2 text-sm transition-colors ${
              active === "delete"
                ? "bg-red-50 font-medium text-red-700"
                : "text-red-700 hover:bg-red-50 hover:text-red-800"
            }`}
          >
            {t("delete_account_nav")}
          </Link>
          {isAdminLike && (
            <Link
              href={`/${lang}/admin/users`}
              className={itemCls(active === "members")}
            >
              {t("admin_manage_users")}
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="whitespace-nowrap rounded-sharp px-3 py-2 text-left text-sm text-ink/60 transition-colors hover:bg-ai/5 hover:text-ai-deep md:mt-2 md:border-t md:border-hairline md:pt-3"
          >
            {t("sign_out")}
          </button>
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
