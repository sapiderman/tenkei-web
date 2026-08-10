import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/app/i18n";
import ProfileEditForm from "@/components/ProfileEditForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getT(lang, "common");

  return {
    title: t("edit_profile_page_title"),
    description: t("edit_profile_page_description"),
    robots: { index: false, follow: true },
  };
}

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  const cookieStore = await cookies();
  const session = cookieStore.get("tenkei_session");
  if (!session?.value) {
    redirect(`/${lang}/login`);
  }

  return <ProfileEditForm lang={lang} />;
}
