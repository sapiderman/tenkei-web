"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import { getProfile } from "@/lib/api-client";
import type { ProfileResponse } from "@/lib/types";
import TwoFactorSettings from "@/components/TwoFactorSettings";
import DashboardShell from "@/components/DashboardShell";

/**
 * Dedicated two-factor (TOTP) page. Loads the profile once for the sidebar
 * role and the current `totp_enabled` state, then hands the QR / verification
 * flow to TwoFactorSettings.
 */
export default function TwoFactorView({ lang }: { lang: string }) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
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
      } else {
        setLoadError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lang, router]);

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

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-500">{t("profile_loading")}</p>
      </div>
    );
  }

  return (
    <DashboardShell lang={lang} role={profile.role} active="twofactor">
      <div className="w-full max-w-lg">
        <TwoFactorSettings lang={lang} enabled={profile.totp_enabled} />
      </div>
    </DashboardShell>
  );
}
