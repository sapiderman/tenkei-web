import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/footer";
import Yudansha from "@/components/yudansha";
import Sensei from "@/components/sensei";
import { getT } from "@/app/i18n"; // Use alias path
import type { Metadata } from "next";

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  return {
    title: `${t("about_us")} - ${t("tenkei_aikidojo")}`,
    description: t("about_page_description"),
  };
}

export default async function About(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  return (
    <>
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-16 lg:p-24 max-w-4xl mx-auto">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              {t("about_tenkei_aikidojo")}
            </h1>
            <div className="relative w-10 h-10 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
              <Image
                src="/tenkei_logo.png"
                alt="Tenkei Logo"
                fill
                sizes="(max-width: 640px) 40px, (max-width: 768px) 80px, 96px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          <p className="text-base sm:text-lg leading-relaxed text-gray-800 text-left sm:text-left">
            {t("about_page_text_p1")}
          </p>

          <div className="text-center">
            <a
              href="https://blog.tenkeiaikidojo.org/2013/07/sejarah-tenkei-aikidojo.html"
              className="inline-block px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg text-blue-600 hover:text-blue-800 
                       hover:underline transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("read_more_history")}
            </a>
          </div>
          <Sensei lang={lang} />
          <Yudansha lang={lang} />
        </div>
      </main>
      <br />
      <Footer lang={lang} />
    </>
  );
}
