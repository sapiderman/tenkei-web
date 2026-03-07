import { getT } from "../app/i18n";
import Image from "next/image";

export default async function Events({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold text-blue-500 uppercase tracking-widest mb-4">
            {t("events")}
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t("latest_from_dojo")}
          </h3>
        </div>

        <div className="relative aspect-video w-full rounded-3xl overflow-hidden glass border-white/5 group">
          <Image
            src="https://asset.tenkeiaikidojo.org/events/ramadhan.png"
            alt="Event at Tenkei Aikidojo"
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-contain p-4 md:p-8 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
