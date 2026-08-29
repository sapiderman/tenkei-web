import Link from "next/link";
import { cookies } from "next/headers";
import { getT } from "../app/i18n";

// variant="light" for paper backgrounds (Dojos page),
// variant="dark" for the blue (bg-ai) join band on the home page.
export default async function JoinButton({
  lang,
  variant = "light",
}: {
  lang: string;
  variant?: "light" | "dark";
}) {
  const { t } = await getT(lang, "common");

  // Next.js 16: cookies() is async
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("tenkei_session")?.value);

  const primary =
    variant === "dark"
      ? "rounded-sharp bg-paper px-8 py-3 text-ai-deep transition-colors hover:bg-white"
      : "rounded-sharp bg-ai px-8 py-3 text-paper transition-colors hover:bg-ai-deep";
  const secondary =
    variant === "dark"
      ? "text-sm text-paper underline-offset-4 transition-colors hover:underline"
      : "text-sm text-ai underline-offset-4 transition-colors hover:text-ai-deep hover:underline";

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Link href={`/${lang}/register`} className={primary}>
        {t("join_now")}
      </Link>
      <Link
        href={hasSession ? `/${lang}/profile` : `/${lang}/login`}
        className={secondary}
      >
        {hasSession ? t("my_profile") : t("sign_in")}
      </Link>
    </div>
  );
}
