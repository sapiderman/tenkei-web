import Link from "next/link";
import Footer from "@/components/footer";
import Header from "@/components/Header";
import { getT } from "@/app/i18n"; // Use alias path
import type { Metadata } from "next";
import { Globe } from "lucide-react";

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  return {
    title: t("shinjuku_page_title"),
    description: t("shinjuku_page_description"),
  };
}

export default async function Shinjuku(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      <Header lang={lang} />
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto animate-fade-in">
        <div className="space-y-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center">
            {t("about_shinjuku_aikikai")}
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed text-white/70 text-center">
            {t("shinjuku_aikikai_text")}
          </p>

          <div className="text-center space-y-8 pt-8">
            <p className="text-white/40 uppercase tracking-widest text-xs font-bold">{t("to_learn_more_shinjuku")}</p>
            <Link
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full glass hover:bg-white/10 text-white transition-all font-medium text-lg"
              href="https://www.shinjukuaikikai.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="w-5 h-5 text-blue-500" />
              www.shinjukuaikikai.com
            </Link>
          </div>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
