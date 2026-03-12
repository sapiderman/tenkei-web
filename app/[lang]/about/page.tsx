import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/footer";
import Yudansha from "@/components/yudansha";
import Sensei from "@/components/sensei";
import Header from "@/components/Header";
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
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      <Header lang={lang} />
      <main className="flex flex-col items-center pt-32 pb-24 px-4 sm:px-8 md:px-16 lg:px-24 max-w-4xl mx-auto animate-fade-in">
        <div className="space-y-12 w-full">
          <div className="flex items-center justify-between gap-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              {t("about_tenkei_aikidojo")}
            </h1>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
              <Image
                src="/tenkei_logo.png"
                alt="Tenkei Logo"
                fill
                sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          <p className="text-lg sm:text-xl leading-relaxed text-white/70 text-left">
            {t("about_page_text_p1")}
          </p>

          <div className="pt-4">
            <a
              href="https://blog.tenkeiaikidojo.org/2013/07/sejarah-tenkei-aikidojo.html"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass hover:bg-white/10 text-white transition-all font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("read_more_history")}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="space-y-24">
            <Sensei lang={lang} />
            <Yudansha lang={lang} />
          </div>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
