"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import { getProfile } from "@/lib/api-client";
import type { ProfileResponse } from "@/lib/types";
import DashboardShell from "@/components/DashboardShell";

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
          className="p-4 bg-red-50 border border-red-300 text-red-700 rounded-sm max-w-md text-center"
          role="alert"
          aria-live="polite"
        >
          {t("profile_load_failed")}
        </div>
      </div>
    );
  }

  if (!profile) return null;

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
    <DashboardShell lang={lang} role={profile.role} active="profile">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6">{t("profile_heading")}</h1>

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
            className="mb-6 p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-sm text-center"
            role="status"
            aria-live="polite"
          >
            {t("admin_pending_notice")}
          </div>
        )}

        <dl className="space-y-3">
          {fields.map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col sm:flex-row sm:items-baseline gap-1 border-b border-gray-100 pb-2"
            >
              <dt className="text-sm font-medium text-gray-500 sm:w-48 shrink-0">
                {label}
              </dt>
              <dd className="text-gray-900">
                {typeof value === "string" && value.trim() ? value : "—"}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </DashboardShell>
  );
}
