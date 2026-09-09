"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/app/i18n/client";
import { resetPassword } from "@/lib/api-client";
import { sanitizeToken } from "@/lib/sanitize";
import PasswordInput from "@/components/PasswordInput";

// Stable token-state codes the BFF relays (app/api/auth/reset-password).
const TOKEN_ERROR_CODES = new Set([
  "invalid_token",
  "expired_token",
  "used_token",
]);

export default function ResetPasswordForm({ lang }: { lang: string }) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = sanitizeToken(searchParams.get("token") ?? "");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false); // invalid/expired/used link
  const [loading, setLoading] = useState(false);

  // Client-side mirror of the backend's 8..72 rule: immediate inline
  // feedback, no network call on a doomed submit.
  function validate(pw: string): string | null {
    if (pw.length < 8) return t("error_password_too_short", { min: 8 });
    if (pw.length > 72) return t("error_password_too_long", { max: 72 });
    if (pw !== confirm) return t("error_password_mismatch");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);

    const problem = validate(password);
    if (problem) {
      setFieldError(problem);
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(token, password);
      if (result.ok) {
        // No auto-login: the member signs in fresh; the login page carries
        // the success notice (?reset=1, mirroring the ?expired=1 pattern).
        router.replace(`/${lang}/login?reset=1`);
        return;
      }
      // Token-state errors → "request a new link" state. Everything else —
      // rate limit, server hiccup, network failure — is an inline error:
      // the link is still good, retrying is the remedy.
      if (result.code && TOKEN_ERROR_CODES.has(result.code)) {
        setTokenError(true);
        return;
      }
      if (result.status === 429) {
        // BFF sends Retry-After as seconds; fall back to its usual 60.
        const minutes = Math.max(
          1,
          Math.ceil((result.retryAfterSeconds ?? 60) / 60),
        );
        setFieldError(t("login_rate_limited", { minutes }));
        return;
      }
      setFieldError(t("reset_password_error"));
    } catch {
      setFieldError(t("reset_password_error"));
    } finally {
      setLoading(false);
    }
  }

  if (tokenError || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">
            {t("reset_password_heading")}
          </h1>
          <div
            className="p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-sm text-sm mb-6"
            role="alert"
            aria-live="polite"
          >
            {t("reset_password_invalid_token")}
          </div>
          <Link
            href={`/${lang}/forgot-password`}
            className="text-sm text-ai hover:underline"
          >
            {t("reset_password_request_new")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {t("reset_password_heading")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new_password"
              className="block text-sm font-medium mb-1"
            >
              {t("new_password")}
            </label>
            <PasswordInput
              id="new_password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
              showLabel={t("show_password")}
              hideLabel={t("hide_password")}
              className="w-full px-3 py-2 border border-ink/20 rounded-sharp focus:outline-hidden focus:ring-2 focus:ring-ai disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="confirm_password"
              className="block text-sm font-medium mb-1"
            >
              {t("confirm_new_password")}
            </label>
            <PasswordInput
              id="confirm_password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
              showLabel={t("show_password")}
              hideLabel={t("hide_password")}
              className="w-full px-3 py-2 border border-ink/20 rounded-sharp focus:outline-hidden focus:ring-2 focus:ring-ai disabled:opacity-50"
            />
          </div>

          {fieldError && (
            <div
              className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-sm text-sm"
              role="alert"
              aria-live="polite"
            >
              {fieldError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="w-full py-2 px-4 bg-ai text-paper rounded-sharp hover:bg-ai-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t("reset_password_loading") : t("reset_password_button")}
          </button>
        </form>
      </div>
    </div>
  );
}
