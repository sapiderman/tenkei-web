import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/app/i18n";
import ProfileView from "@/components/ProfileView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getT(lang, "common");

  return {
    title: t("profile_page_title"),
    description: t("profile_page_description"),
    robots: { index: false, follow: true },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Next.js 16: cookies() is async
  const cookieStore = await cookies();
  const session = cookieStore.get("tenkei_session");
  if (!session?.value) {
    redirect(`/${lang}/login`);
  }

  return <ProfileView lang={lang} />;
}
