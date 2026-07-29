import Link from "next/link";
import { cookies } from "next/headers";
import { getT } from "../app/i18n"; // Adjust path as needed

export default async function JoinButton({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  // Next.js 16: cookies() is async
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("tenkei_session")?.value);

  return (
    <div className="mt-4 block mx-auto text-center w-full md:w-1/2">
      <Link
        href={`/${lang}/register`}
        className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 block transition-colors"
      >
        {t("join_now")}
      </Link>
      <Link
        href={hasSession ? `/${lang}/profile` : `/${lang}/login`}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline block"
      >
        {hasSession ? t("my_profile") : t("sign_in")}
      </Link>
    </div>
  );
}
