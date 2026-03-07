import Image from "next/image";
import Link from "next/link";
import { getT } from "@/app/i18n";

export default async function Hero({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  return (
    <section className="relative pt-40 pb-20 md:pt-60 md:pb-40 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 text-xs font-medium text-white/60 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          {t("welcome_message")}
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 animate-slide-up [animation-delay:200ms]">
          <span className="text-gradient">Aikido for the</span>
          <br />
          <span className="text-white">Modern World</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/60 mb-12 animate-slide-up [animation-delay:400ms]">
          {t("tenkei_aikidojo_description")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up [animation-delay:600ms]">
          <Link
            href={`/${lang}/register`}
            className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all transform hover:scale-105 w-full sm:w-auto text-center"
          >
            {t("join_now")}
          </Link>
          <Link
            href={`/${lang}/about`}
            className="px-8 py-4 glass text-white font-semibold rounded-full hover:bg-white/10 transition-all w-full sm:w-auto text-center"
          >
            {t("about_us")}
          </Link>
        </div>
      </div>

      <div className="mt-20 max-w-5xl mx-auto px-6 animate-fade-in [animation-delay:800ms]">
        <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden glass border-white/10 p-2">
            <div className="relative w-full h-full rounded-xl overflow-hidden">
                <Image
                    src="/tenkei_text_logo.png"
                    alt="Tenkei Aikidojo"
                    fill
                    className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
            </div>
        </div>
      </div>
    </section>
  );
}
