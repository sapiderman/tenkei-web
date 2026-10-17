import type { Metadata } from "next";
import { getT } from "@/app/i18n"; // Correct server entry point
import { pageMetadata } from "@/lib/seo";
import RegisterForm from "@/components/RegisterForm";

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
  return pageMetadata(
    lang,
    "/register",
    t("register_page_title"),
    t("register_page_description"),
  );
}

export default async function RegisterPage() {
  return <RegisterForm />;
}
