import Link from "next/link";
import { cookies } from "next/headers";
import { getT } from "../app/i18n"; // Adjust path as needed

export default async function JoinButton({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  // Next.js 16: cookies() is async
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("tenkei_session")?.value);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Link
        href={`/${lang}/register`}
        className="rounded-sharp bg-ai px-8 py-3 text-paper transition-colors hover:bg-ai-deep"
      >
        {t("join_now")}
      </Link>
      <Link
        href={hasSession ? `/${lang}/profile` : `/${lang}/login`}
        className="text-sm text-ai underline-offset-4 transition-colors hover:text-ai-deep hover:underline"
      >
        {hasSession ? t("my_profile") : t("sign_in")}
      </Link>
    </div>
  );
}
