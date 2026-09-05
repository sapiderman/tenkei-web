import { Suspense } from "react";
import type { Metadata } from "next";
import { getT } from "@/app/i18n";
import LoginForm from "@/components/LoginForm";

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
  const title = t("login_page_title");
  const description = t("login_page_description");

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: {
      canonical: `https://www.tenkeiaikidojo.org/${lang}/login`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.tenkeiaikidojo.org/${lang}/login`,
      type: "website",
    },
  };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <Suspense fallback={null}>
      <LoginForm lang={lang} />
    </Suspense>
  );
}
