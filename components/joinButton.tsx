import Link from "next/link";
import { getT } from "../app/i18n"; // Adjust path as needed

export default async function JoinButton({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");
  return (
    <Link
      href={`/${lang}/register`}
      className="mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-700 block mx-auto text-center w-full md:w-1/2"
    >
      {t("join_now")}
    </Link>
  );
}
