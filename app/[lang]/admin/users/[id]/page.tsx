import type { Metadata } from "next";
import { getT } from "@/app/i18n";
import AdminUserDetailView from "@/components/AdminUserDetailView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getT(lang, "common");

  return {
    title: t("admin_user_page_title"),
    description: t("admin_user_page_description"),
    robots: { index: false, follow: true },
  };
}

// Role gate lives in app/[lang]/admin/layout.tsx.
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  return <AdminUserDetailView lang={lang} id={id} />;
}
