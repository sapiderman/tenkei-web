import type { Metadata } from "next";
import { getT } from "@/app/i18n"; // Correct server entry point
import RegisterForm from "@/components/RegisterForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getT(lang, "common");
  const title = t("register_page_title");
  const description = t("register_page_description");

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.tenkeiaikidojo.org/${lang}/register`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.tenkeiaikidojo.org/${lang}/register`,
      type: "website",
    },
  };
}

export default async function RegisterPage() {
  return <RegisterForm />;
}
