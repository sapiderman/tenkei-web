import { Suspense } from "react";
import type { Metadata } from "next";
import { getT } from "@/app/i18n";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

// Portal pages serve the strict nonce CSP (see proxy.ts); a nonce requires
// dynamic rendering — static prerendering would cache a stale nonce.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getT(lang, "common");
  const title = t("forgot_password_page_title");

  return {
    title,
    robots: { index: false, follow: true },
    alternates: {
      canonical: `https://www.tenkeiaikidojo.org/${lang}/forgot-password`,
    },
    openGraph: {
      title,
      url: `https://www.tenkeiaikidojo.org/${lang}/forgot-password`,
      type: "website",
    },
  };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm lang={lang} />
    </Suspense>
  );
}
