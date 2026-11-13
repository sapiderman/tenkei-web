"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import {
  deleteAccount,
  getProfile,
  requestDeletionCode,
} from "@/lib/api-client";
import type { ProfileResponse } from "@/lib/types";
import DashboardShell from "@/components/DashboardShell";

/**
 * Account self-deletion page under /profile/delete. Verification branches on
 * the profile's `totp_enabled`: the current TOTP code when 2FA is on, a
 * 6-digit one-time code emailed on request when off. Deletion always passes
 * through the confirm modal — there is no one-click delete.
 */
export default function DeleteAccountView({ lang }: { lang: string }) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false); // email branch: code requested
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

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

  // Escape cancels and Tab stays inside the dialog while it is open.
  useEffect(() => {
    if (confirmOpen) cancelButtonRef.current?.focus();
  }, [confirmOpen]);

  function handleDialogKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setConfirmOpen(false);
      return;
    }
    if (e.key !== "Tab") return;
    const focusables =
      dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea",
      ) ?? [];
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  async function handleSendCode() {
    setBusy(true);
    setError(null);
    const result = await requestDeletionCode();
    setBusy(false);
    if (result.ok) {
      setSent(true);
      return;
    }
    if (result.status === 429) {
      setError(t("delete_error_rate_limited"));
      return;
    }
    if (result.status === 401) {
      router.replace(`/${lang}/login?expired=1`);
      return;
    }
    setError(t("delete_error_generic"));
  }

  function handleOpenConfirm(e: React.FormEvent) {
    e.preventDefault();
    // Native pattern validation covers Enter-submits in real browsers; this
    // guard covers engines with quirky implicit submission.
    if (code.trim().length !== 6) return;
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    setBusy(true);
    setError(null);
    const result = await deleteAccount(code.trim());
    setBusy(false);
    if (result.ok) {
      // The backend deleted the session row and cleared the cookie — the
      // farewell banner rides the query param, the homepage renders fresh.
      router.replace(`/${lang}?deleted=1`);
      return;
    }
    setConfirmOpen(false);
    if (result.status === 400) {
      setError(t("delete_error_invalid_code"));
      return;
    }
    if (result.status === 429) {
      setError(t("delete_error_rate_limited"));
      return;
    }
    if (result.status === 401) {
      router.replace(`/${lang}/login?expired=1`);
      return;
    }
    setError(t("delete_error_generic"));
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

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-500">{t("profile_loading")}</p>
      </div>
    );
  }

  const totpEnabled = !!profile.totp_enabled;

  const inputClass =
    "w-full px-3 py-2 border border-ink/20 rounded-sharp focus:outline-hidden focus:ring-2 focus:ring-ai disabled:opacity-50";

  return (
    <DashboardShell lang={lang} role={profile.role} active="delete">
      <div className="w-full max-w-lg">
        <section className="border border-gray-200 rounded-sm p-4">
          <h1 className="text-2xl font-bold">{t("delete_heading")}</h1>

          <div className="mt-3 p-3 bg-red-50 border border-red-300 text-red-700 rounded-sm text-sm">
            {t("delete_intro")}
          </div>

          {!totpEnabled && (
            <p className="mt-3 text-sm text-gray-600">
              {t("delete_lost_inbox_note")}
            </p>
          )}

          {!totpEnabled && (
            <button
              type="button"
              onClick={() => void handleSendCode()}
              disabled={busy || sent}
              className="mt-4 px-4 py-2 bg-ink text-paper rounded-sharp hover:bg-ink/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sent ? t("delete_code_sent") : t("delete_send_code")}
            </button>
          )}

          {(totpEnabled || sent) && (
            <form onSubmit={handleOpenConfirm} className="mt-4 space-y-3">
              {totpEnabled && (
                <p className="text-sm text-gray-600">
                  {t("twofa_step_instruction")}
                </p>
              )}
              <div>
                <label
                  htmlFor="delete-code"
                  className="block text-sm font-medium mb-1"
                >
                  {t("delete_code_label")}
                </label>
                <input
                  id="delete-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  disabled={busy}
                  required
                  className={`${inputClass} text-center text-lg tracking-[0.5em]`}
                />
                {!totpEnabled && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t("delete_code_hint")}
                  </p>
                )}
              </div>
              {error && <ErrorBox message={error} />}
              <button
                type="submit"
                disabled={busy || code.trim().length !== 6}
                className="px-4 py-2 bg-red-600 text-white rounded-sharp hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("delete_button")}
              </button>
            </form>
          )}

          {error && !totpEnabled && !sent && <ErrorBox message={error} />}

          {confirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-confirm-title"
                aria-describedby="delete-confirm-body"
                onKeyDown={handleDialogKeyDown}
                className="w-full max-w-md rounded-sm border border-red-300 bg-paper p-6 shadow-xl"
              >
                <h2
                  id="delete-confirm-title"
                  className="text-lg font-bold text-red-700"
                >
                  {t("delete_confirm_title")}
                </h2>
                <p
                  id="delete-confirm-body"
                  className="mt-2 text-sm text-gray-600"
                >
                  {t("delete_confirm_body")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleConfirmDelete()}
                    disabled={busy}
                    className="px-4 py-2 bg-red-600 text-white rounded-sharp hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t("delete_confirm_yes")}
                  </button>
                  <button
                    type="button"
                    ref={cancelButtonRef}
                    onClick={() => setConfirmOpen(false)}
                    disabled={busy}
                    className="px-4 py-2 bg-ink/10 text-ink rounded-sharp hover:bg-ink/20 transition-colors"
                  >
                    {t("delete_confirm_cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-sm text-sm"
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
