"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/app/i18n/client";
import { login, verify2FA } from "@/lib/api-client";
import PasswordInput from "@/components/PasswordInput";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { sanitizeToken } from "@/lib/sanitize";

export default function LoginForm({ lang }: { lang: string }) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  // 2FA step 2: the password was accepted and a pending session cookie is
  // set — collect the 6-digit code from the authenticator before promoting.
  // A sessionStorage flag survives a refresh mid-step; it is only a hint —
  // a stale one self-heals (verify hits 401 session_expired → back to step 1).
  const [awaiting2fa, setAwaiting2fa] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("tenkei_2fa_pending") === "1") {
      setAwaiting2fa(true);
    }
  }, []);

  function enter2faStep() {
    sessionStorage.setItem("tenkei_2fa_pending", "1");
    setPassword("");
    setTotpCode("");
    setAwaiting2fa(true);
  }

  function exit2faStep() {
    sessionStorage.removeItem("tenkei_2fa_pending");
    setTotpCode("");
    setAwaiting2fa(false);
  }

  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    (process.env.NODE_ENV === "development" ? "1x00000000000000000000AA" : "");
  const isTurnstileConfigured = Boolean(turnstileSiteKey);

  const handleTurnstileSuccess = (token: string) => {
    setTurnstileToken(sanitizeToken(token));
  };

  const handleTurnstileError = () => {
    setError(t("error_security_load_failed"));
    setTurnstileToken("");
  };

  const handleTurnstileExpired = () => {
    setTurnstileToken("");
    setError(t("error_security_expired"));
  };

  const expiredNotice = searchParams.get("expired") === "1";
  const resetNotice = searchParams.get("reset") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!sanitizeToken(turnstileToken)) {
      setError(t("error_security_required"));
      return;
    }

    setLoading(true);

    try {
      const result = await login(identifier, password, turnstileToken);
      if (result.ok) {
        if (result.twoFactorRequired) {
          // Password accepted; pending session cookie is set. Drop the
          // password from state and ask for the authenticator code.
          enter2faStep();
          return;
        }
        sessionStorage.removeItem("tenkei_2fa_pending");
        router.push(`/${lang}/profile`);
        return;
      }
      // 429 is a lockout, not a credential failure — show the cooldown so
      // the user waits instead of hammering (and re-tripping) the limiter.
      if (result.status === 429) {
        const minutes = Math.max(
          1,
          Math.ceil((result.retryAfterSeconds ?? 300) / 60),
        );
        setError(t("login_rate_limited", { minutes }));
        return;
      }
      setError(t("login_failed"));
    } catch {
      setError(t("login_failed"));
    } finally {
      setLoading(false);
      // Turnstile tokens are single-use — a failed attempt burns the token,
      // so reset the widget or every retry would fail verification.
      setTurnstileToken("");
      turnstileRef.current?.reset();
    }
  }

  /** Login step 2: exchange the authenticator code for the promoted session. */
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = totpCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError(t("twofa_invalid_code"));
      return;
    }

    setVerifying(true);
    try {
      const result = await verify2FA(code);
      if (result.ok) {
        sessionStorage.removeItem("tenkei_2fa_pending");
        router.push(`/${lang}/profile`);
        return;
      }
      if (result.reason === "locked" || result.reason === "expired") {
        // The pending session is gone — restart from the password step.
        exit2faStep();
        setError(
          t(
            result.reason === "locked"
              ? "twofa_locked"
              : "twofa_session_expired",
          ),
        );
        return;
      }
      if (result.reason === "unavailable" || result.reason === "error") {
        // Service problem (kill switch / 5xx / network) — not a wrong code.
        setError(t("twofa_error"));
        return;
      }
      setError(t("twofa_invalid_code"));
    } catch {
      setError(t("twofa_error"));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/tenkei_logo.png"
            alt="Tenkei Aikidojo emblem"
            width={64}
            height={64}
            className="object-contain opacity-60"
            style={{
              filter:
                "grayscale(1) sepia(1) hue-rotate(180deg) saturate(1.3) brightness(1)",
            }}
          />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center">
          {t("login_page_title")}
        </h1>

        {expiredNotice && (
          <div
            className="mb-4 p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-sm text-sm"
            role="status"
            aria-live="polite"
          >
            {t("session_expired_notice")}
          </div>
        )}

        {resetNotice && (
          <div
            className="mb-4 p-3 bg-green-50 border border-green-300 text-green-800 rounded-sm text-sm"
            role="status"
            aria-live="polite"
          >
            {t("password_reset_notice")}
          </div>
        )}

        {error && (
          <div
            className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-sm text-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {awaiting2fa ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600">
              {t("twofa_step_instruction")}
            </p>
            <div>
              <label
                htmlFor="totp-code"
                className="block text-sm font-medium mb-1"
              >
                {t("twofa_code_label")}
              </label>
              <input
                id="totp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                disabled={verifying}
                required
                autoFocus
                className="w-full px-3 py-2 border border-ink/20 rounded-sharp text-center text-lg tracking-[0.5em] focus:outline-hidden focus:ring-2 focus:ring-ai disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={verifying || totpCode.trim().length !== 6}
              className="w-full py-2 px-4 bg-ai text-paper rounded-sharp hover:bg-ai-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifying ? t("twofa_verifying") : t("twofa_verify_button")}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  // The pending cookie is short-lived (5 min) and only
                  // reaches /api/auth/2fa/verify — dropping back to the
                  // password step is safe; a fresh login replaces it.
                  exit2faStep();
                  setError(null);
                }}
                className="text-sm text-ai hover:underline"
              >
                {t("twofa_cancel")}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium mb-1"
              >
                {t("identifier")}
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t("identifier_placeholder")}
                autoComplete="username"
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-ink/20 rounded-sharp focus:outline-hidden focus:ring-2 focus:ring-ai disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                {t("password")}
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
                showLabel={t("show_password")}
                hideLabel={t("hide_password")}
                className="w-full px-3 py-2 border border-ink/20 rounded-sharp focus:outline-hidden focus:ring-2 focus:ring-ai disabled:opacity-50"
              />
            </div>

            {!isTurnstileConfigured ? (
              <div
                className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-sm text-sm"
                role="alert"
              >
                {t("error_security_unconfigured")}
              </div>
            ) : (
              <Turnstile
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                onSuccess={handleTurnstileSuccess}
                onError={handleTurnstileError}
                onTimeout={handleTurnstileExpired}
                onUnsupported={() => setError(t("error_security_unsupported"))}
                scriptOptions={{ crossOrigin: "anonymous" }}
              />
            )}

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full py-2 px-4 bg-ai text-paper rounded-sharp hover:bg-ai-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t("login_loading") : t("login_button")}
            </button>

            <div className="text-center">
              <Link
                href={`/${lang}/forgot-password`}
                className="text-sm text-ai hover:underline"
              >
                {t("forgot_password_link")}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
