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
  return {
    title: t("register_page_title"),
    description: t("register_page_description"),
  };
}

export default async function RegisterPage() {
  return <RegisterForm />;
}
