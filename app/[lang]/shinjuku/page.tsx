import Link from "next/link";
import Footer from "@/components/footer";
import { getT } from "@/app/i18n"; // Use alias path
import type { Metadata } from "next";

export async function generateMetadata({
  params: { lang },
}: {
  params: { lang: string };
}): Promise<Metadata> {
  const { t } = await getT(lang, "common");
  return {
    title: t("shinjuku_page_title"),
    description: t("shinjuku_page_description"),
  };
}

export default async function Shinjuku({
  params: { lang },
}: {
  params: { lang: string };
}) {
  const { t } = await getT(lang, "common");
  return (
    <>
      <main className="flex min-h-screen flex-col items-center p-8 md:p-24 max-w-4xl mx-auto">
        <div className="space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center">
            {t("about_shinjuku_aikikai")}
          </h1>

          <p className="text-lg leading-relaxed text-gray-800">
            {t("shinjuku_aikikai_text")}
          </p>

          <div className="text-center space-y-4">
            <p className="text-lg font-medium">{t("to_learn_more_shinjuku")}</p>
            <Link
              className="inline-block px-6 py-3 text-lg text-blue-600 hover:text-blue-800 
                         hover:underline transition-colors duration-200"
              href="https://www.shinjukuaikikai.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.shinjukuaikikai.com
            </Link>
          </div>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
