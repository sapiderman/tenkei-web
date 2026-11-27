import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/app/i18n";
import { resolveRole } from "@/lib/server-auth";
import AttendanceView from "@/components/AttendanceView";

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

  return {
    title: t("attendance_page_title"),
    description: t("attendance_page_description"),
    robots: { index: false, follow: true },
  };
}

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Next.js 16: cookies() is async
  const cookieStore = await cookies();
  const role = await resolveRole(cookieStore);
  if (!role) {
    redirect(`/${lang}/login`);
  }
  // Unverified members get 403 from the backend; send them where the
  // pending notice already explains why.
  if (role === "new") {
    redirect(`/${lang}/profile`);
  }

  return <AttendanceView lang={lang} role={role} />;
}
