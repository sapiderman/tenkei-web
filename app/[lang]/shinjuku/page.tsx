import Link from "next/link";
import Footer from "@/components/footer";
import { getT } from "@/app/i18n"; // Use alias path
import type { Metadata } from "next";

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  const title = t("shinjuku_page_title");
  const description = t("shinjuku_page_description");

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.tenkeiaikidojo.org/${lang}/shinjuku`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.tenkeiaikidojo.org/${lang}/shinjuku`,
      type: "website",
    },
  };
}

export default async function Shinjuku(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  return (
    <>
      <main className="flex min-h-screen flex-col items-center px-4 py-16 sm:px-6 max-w-4xl mx-auto">
        <div className="space-y-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-center">
            {t("about_shinjuku_aikikai")}
          </h1>

          <p className="text-lg leading-relaxed text-ink/70">
            {t("shinjuku_aikikai_text")}
          </p>

          <div className="text-center space-y-4">
            <p className="text-lg font-medium">{t("to_learn_more_shinjuku")}</p>
            <Link
              className="inline-block px-6 py-3 text-lg text-ai hover:text-ai-deep 
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
