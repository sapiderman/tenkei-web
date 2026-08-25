"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "@/app/i18n/client";
import { login } from "@/lib/api-client";
import PasswordInput from "@/components/PasswordInput";

export default function LoginForm({ lang }: { lang: string }) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const expiredNotice = searchParams.get("expired") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(identifier, password);
      if (result.ok) {
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
            className="mb-4 p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded text-sm"
            role="status"
            aria-live="polite"
          >
            {t("session_expired_notice")}
          </div>
        )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {error && (
            <div
              className="p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !identifier || !password}
            className="w-full py-2 px-4 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t("login_loading") : t("login_button")}
          </button>
        </form>
      </div>
    </div>
  );
}
