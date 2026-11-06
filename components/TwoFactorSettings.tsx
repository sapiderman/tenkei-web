"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "@/app/i18n/client";
import {
  confirm2FA,
  disable2FA,
  enroll2FA,
  type TotpMutationResult,
} from "@/lib/api-client";
import PasswordInput from "@/components/PasswordInput";

/**
 * Two-factor (TOTP) management, full page under /profile/twofactor.
 *
 * `enabled` comes from the profile payload (`totp_enabled`). On backends
 * that don't send it yet it is undefined → treated as not-enabled and
 * enrollment starts on mount; the 409 fallback in startSetup keeps the
 * disable panel reachable either way. A 404 from enroll/disable means the
 * server-side kill switch is off — the page renders nothing.
 */
type Stage =
  | "loading" // enrollment in flight on mount
  | "setup" // QR + confirm form
  | "disable" // 2FA is on: disable form
  | "enabled-notice"
  | "disabled-notice"
  | "unavailable"; // kill switch off — render nothing

export default function TwoFactorSettings({
  lang,
  enabled = false,
}: {
  lang: string;
  enabled?: boolean;
}) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();

  const [enabledState, setEnabledState] = useState(enabled);
  const [stage, setStage] = useState<Stage>(enabled ? "disable" : "loading");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function resetForm() {
    setCode("");
    setPassword("");
    setError(null);
  }

  /** Arms enrollment and reveals the QR; runs once on mount. */
  async function startSetup() {
    setBusy(true);
    setError(null);
    const result = await enroll2FA();
    setBusy(false);
    if (result.ok) {
      setSecret(result.secret);
      setOtpauthUrl(result.otpauthUrl);
      setStage("setup");
      return;
    }
    if (result.status === 409) {
      // Stale enabled state (e.g. old profile payload) — the server says
      // 2FA is already on: sync the badge, then show the disable form.
      resetForm();
      setEnabledState(true);
      setStage("disable");
      return;
    }
    if (result.status === 404) {
      setStage("unavailable");
      return;
    }
    if (result.status === 401) {
      router.replace(`/${lang}/login?expired=1`);
      return;
    }
    setError(t("twofa_error"));
  }

  // The page is the whole flow: enrollment starts on mount so the QR shows
  // without an extra click. The ref keeps React Strict Mode's double-invoked
  // effect from issuing two enrollment secrets.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || enabledState) return;
    started.current = true;
    void startSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Maps confirm/disable failures to a message; resolves when done. */
  function mutationError(result: TotpMutationResult): string | null {
    if (result.ok) return null;
    if (result.reason === "password") return t("twofa_wrong_password");
    if (result.reason === "code") return t("twofa_invalid_code");
    if (result.reason === "unauthorized") {
      router.replace(`/${lang}/login?expired=1`);
      return null;
    }
    if (result.reason === "unavailable") {
      // Kill switch turned off mid-session (404) — same as enroll's 404:
      // the page renders nothing (see header comment).
      setStage("unavailable");
      return null;
    }
    return t("twofa_error");
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await confirm2FA(code.trim(), password);
    setBusy(false);
    const errorMessage = mutationError(result);
    if (errorMessage) {
      setError(errorMessage);
      return;
    }
    if (result.ok) {
      resetForm();
      setSecret("");
      setOtpauthUrl("");
      setEnabledState(true);
      setStage("enabled-notice");
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await disable2FA(code.trim(), password);
    setBusy(false);
    const errorMessage = mutationError(result);
    if (errorMessage) {
      setError(errorMessage);
      return;
    }
    if (result.ok) {
      resetForm();
      setEnabledState(false);
      setStage("disabled-notice");
    }
  }

  if (stage === "unavailable") return null;

  const inputClass =
    "w-full px-3 py-2 border border-ink/20 rounded-sharp focus:outline-hidden focus:ring-2 focus:ring-ai disabled:opacity-50";

  return (
    <section className="border border-gray-200 rounded-sm p-4">
      <h1 className="text-2xl font-bold">
        {t("twofa_title")}
        {enabledState && (
          <span className="ml-2 inline-flex items-center rounded-full border border-green-300 bg-green-50 px-2 py-0.5 align-middle text-xs font-normal text-green-800">
            {t("twofa_status_enabled")}
          </span>
        )}
      </h1>

      {stage === "loading" && error && (
        <div className="mt-3 space-y-3">
          <ErrorBox message={error} />
          <button
            type="button"
            onClick={() => void startSetup()}
            className="px-4 py-2 bg-ai text-paper rounded-sharp hover:bg-ai-deep transition-colors"
          >
            {t("twofa_retry")}
          </button>
        </div>
      )}
      {stage === "loading" && !error && (
        <p className="mt-3 text-sm text-gray-600" role="status">
          {t("twofa_loading")}
        </p>
      )}

      {stage === "setup" && (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-gray-600">{t("twofa_setup_scan")}</p>
          <div className="flex justify-center p-3 bg-white border border-gray-200 rounded-sm w-fit mx-auto">
            <QRCodeSVG
              value={otpauthUrl}
              size={180}
              level="M"
              aria-label={t("twofa_qr_alt")}
              role="img"
            />
          </div>
          <p className="text-sm text-gray-600">
            {t("twofa_setup_manual")}{" "}
            <code className="px-1 py-0.5 bg-gray-100 rounded-sm text-sm break-all select-all">
              {secret}
            </code>
          </p>
          <form onSubmit={handleConfirm} className="space-y-3">
            <p className="text-sm text-gray-600">{t("twofa_setup_confirm")}</p>
            <div>
              <label
                htmlFor="twofa-code"
                className="block text-sm font-medium mb-1"
              >
                {t("twofa_code_label")}
              </label>
              <input
                id="twofa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={busy}
                required
                className={`${inputClass} text-center text-lg tracking-[0.5em]`}
              />
            </div>
            <div>
              <label
                htmlFor="twofa-password"
                className="block text-sm font-medium mb-1"
              >
                {t("twofa_current_password")}
              </label>
              <PasswordInput
                id="twofa-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
                required
                showLabel={t("show_password")}
                hideLabel={t("hide_password")}
                className={inputClass}
              />
            </div>
            {error && <ErrorBox message={error} />}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={busy || code.trim().length !== 6 || !password}
                className="px-4 py-2 bg-ai text-paper rounded-sharp hover:bg-ai-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? t("twofa_confirming") : t("twofa_confirm_button")}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Enrollment is only armed by confirm — leaving here
                  // simply discards the shown-once secret.
                  router.push(`/${lang}/profile`);
                }}
                className="px-4 py-2 text-sm text-ai hover:underline"
              >
                {t("twofa_cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {stage === "disable" && (
        <div className="mt-3 space-y-4">
          <p className="text-sm text-gray-600">
            {t("twofa_disable_instruction")}
          </p>
          <form onSubmit={handleDisable} className="space-y-3">
            <div>
              <label
                htmlFor="twofa-code"
                className="block text-sm font-medium mb-1"
              >
                {t("twofa_code_label")}
              </label>
              <input
                id="twofa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={busy}
                required
                className={`${inputClass} text-center text-lg tracking-[0.5em]`}
              />
            </div>
            <div>
              <label
                htmlFor="twofa-password"
                className="block text-sm font-medium mb-1"
              >
                {t("twofa_current_password")}
              </label>
              <PasswordInput
                id="twofa-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
                required
                showLabel={t("show_password")}
                hideLabel={t("hide_password")}
                className={inputClass}
              />
            </div>
            {error && <ErrorBox message={error} />}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={busy || code.trim().length !== 6 || !password}
                className="px-4 py-2 bg-red-600 text-white rounded-sharp hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? t("twofa_disabling") : t("twofa_disable_button")}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${lang}/profile`)}
                className="px-4 py-2 text-sm text-ai hover:underline"
              >
                {t("twofa_cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {(stage === "enabled-notice" || stage === "disabled-notice") && (
        <div className="mt-3">
          <div
            className="p-3 bg-green-50 border border-green-300 text-green-800 rounded-sm text-sm"
            role="status"
            aria-live="polite"
          >
            {stage === "enabled-notice"
              ? t("twofa_enabled_notice")
              : t("twofa_disabled_notice")}
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${lang}/profile`)}
            className="mt-3 px-4 py-2 bg-ink/10 text-ink rounded-sharp hover:bg-ink/20 transition-colors text-sm"
          >
            {t("twofa_done")}
          </button>
        </div>
      )}
    </section>
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
