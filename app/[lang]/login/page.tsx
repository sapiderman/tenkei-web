import { Suspense } from "react";
import type { Metadata } from "next";
import { getT } from "@/app/i18n";
import LoginForm from "@/components/LoginForm";

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
