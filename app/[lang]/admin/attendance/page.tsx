import type { Metadata } from "next";
import { getT } from "@/app/i18n";
import AdminAttendanceView from "@/components/AdminAttendanceView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getT(lang, "common");

  return {
    title: t("admin_attendance_page_title"),
    description: t("admin_attendance_page_description"),
    robots: { index: false, follow: true },
  };
}

// Role gate lives in app/[lang]/admin/layout.tsx.
export default async function AdminAttendancePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return <AdminAttendanceView lang={lang} />;
}
