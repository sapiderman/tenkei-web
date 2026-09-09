"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "@/app/i18n/client";
import { forgotPassword } from "@/lib/api-client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { sanitizeToken } from "@/lib/sanitize";

export default function ForgotPasswordForm({ lang }: { lang: string }) {
  const { t } = useTranslation(lang, "common");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!sanitizeToken(turnstileToken)) {
      setError(t("error_security_required"));
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(email, turnstileToken);
      if (result.ok) {
        // Generic confirmation — identical for registered and unregistered
        // addresses; the response says nothing about account existence.
        setDone(true);
        return;
      }
      if (result.status === 429) {
        const minutes = Math.max(
          1,
          Math.ceil((result.retryAfterSeconds ?? 300) / 60),
        );
        setError(t("login_rate_limited", { minutes }));
        return;
      }
      setError(t("forgot_password_error"));
    } catch {
      setError(t("forgot_password_error"));
    } finally {
      setLoading(false);
      // Tokens are single-use — reset the widget or every retry would fail.
      setTurnstileToken("");
      turnstileRef.current?.reset();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">
          {t("forgot_password_heading")}
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          {t("forgot_password_description")}
        </p>

        {done ? (
          <div
            className="p-3 bg-green-50 border border-green-300 text-green-800 rounded-sm text-sm"
            role="status"
            aria-live="polite"
          >
            {t("forgot_password_success")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                {t("email_label")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email_placeholder")}
                autoComplete="email"
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-ink/20 rounded-sharp focus:outline-hidden focus:ring-2 focus:ring-ai disabled:opacity-50"
              />
            </div>

            {error && (
              <div
                className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-sm text-sm"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

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
              disabled={loading || !email}
              className="w-full py-2 px-4 bg-ai text-paper rounded-sharp hover:bg-ai-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? t("forgot_password_loading")
                : t("forgot_password_button")}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link
            href={`/${lang}/login`}
            className="text-sm text-ai hover:underline"
          >
            {t("forgot_password_back_to_login")}
          </Link>
        </div>
      </div>
    </div>
  );
}
