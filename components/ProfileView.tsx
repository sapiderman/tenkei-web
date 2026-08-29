"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import { getProfile, logout } from "@/lib/api-client";
import type { ProfileResponse } from "@/lib/types";

export default function ProfileView({
  lang,
  saved = false,
}: {
  lang: string;
  saved?: boolean;
}) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();

  const [showSaved, setShowSaved] = useState(saved);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getProfile();
      if (cancelled) return;

      if (result.ok) {
        setProfile(result.profile);
      } else if (result.status === 401) {
        router.replace(`/${lang}/login?expired=1`);
        return;
      } else {
        setLoadError(true);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lang, router]);

  async function handleLogout() {
    await logout();
    router.push(`/${lang}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-500">{t("profile_loading")}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="p-4 bg-red-50 border border-red-300 text-red-700 rounded max-w-md text-center"
          role="alert"
          aria-live="polite"
        >
          {t("profile_load_failed")}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isAdminLike = profile.role === "admin" || profile.role === "superuser";
  const isPending = profile.role === "new";

  const fields: { label: string; value: string | boolean }[] = [
    { label: t("profile_name"), value: profile.name },
    { label: t("profile_email"), value: profile.email },
    { label: t("profile_whatsapp"), value: profile.whatsapp },
    { label: t("profile_dojo"), value: profile.dojo },
    { label: t("profile_rank"), value: profile.rank },
    { label: t("profile_date_of_birth"), value: profile.date_of_birth },
    { label: t("profile_join_date"), value: profile.join_date },
    { label: t("profile_last_grading_date"), value: profile.last_grading_date },
    { label: t("profile_role"), value: profile.role },
    {
      label: t("profile_consent_datastore"),
      value: profile.consent_datastore ? t("yes") : t("no"),
    },
    {
      label: t("profile_consent_marketing"),
      value: profile.consent_marketing ? t("yes") : t("no"),
    },
    {
      label: t("profile_medical_conditions"),
      value: profile.medical_conditions,
    },
    {
      label: t("profile_emergency_contact_name"),
      value: profile.emergency_contact_name,
    },
    {
      label: t("profile_emergency_contact_number"),
      value: profile.emergency_contact_number,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("profile_heading")}</h1>
          <Link
            href={`/${lang}/profile/edit`}
            className="text-sm text-ai hover:text-ai-deep underline"
          >
            {t("edit_profile")}
          </Link>
        </div>

        {showSaved && (
          <div
            className="mb-6 p-3 bg-green-50 border border-green-300 text-green-800 rounded-md flex items-start justify-between gap-3"
            role="status"
            aria-live="polite"
          >
            <span className="text-sm">{t("profile_saved")}</span>
            <button
              type="button"
              onClick={() => setShowSaved(false)}
              aria-label={t("dismiss")}
              className="text-green-700 hover:text-green-900 text-sm leading-none"
            >
              ✕
            </button>
          </div>
        )}

        {isPending && (
          <div
            className="mb-6 p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded text-center"
            role="status"
            aria-live="polite"
          >
            {t("admin_pending_notice")}
          </div>
        )}

        {isAdminLike && (
          <div className="mb-6 text-center">
            <Link
              href={`/${lang}/admin/users`}
              className="inline-block px-4 py-2 bg-ai text-paper rounded-sharp hover:bg-ai-deep transition-colors"
            >
              {t("admin_manage_users")}
            </Link>
          </div>
        )}

        <dl className="space-y-3">
          {fields.map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col sm:flex-row sm:items-baseline gap-1 border-b border-gray-100 pb-2"
            >
              <dt className="text-sm font-medium text-gray-500 sm:w-48 flex-shrink-0">
                {label}
              </dt>
              <dd className="text-gray-900">
                {typeof value === "string" && value.trim() ? value : "—"}
              </dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 w-full py-2 px-4 bg-ink/10 text-ink rounded-sharp hover:bg-ink/20 transition-colors"
        >
          {t("sign_out")}
        </button>
      </div>
    </div>
  );
}
