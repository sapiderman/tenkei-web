import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/app/i18n";
import DeleteAccountView from "@/components/DeleteAccountView";

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
    title: t("delete_page_title"),
    description: t("delete_page_description"),
    robots: { index: false, follow: true },
  };
}

export default async function DeleteAccountPage({
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

  return <DeleteAccountView lang={lang} />;
}
