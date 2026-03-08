import Footer from "@/components/footer";
import JoinButton from "@/components/joinButton";
import Image from "next/image";
import Header from "@/components/Header";
import { getT } from "@/app/i18n"; // Use alias path
import type { Metadata } from "next";
import { fees, schedules } from "./data"; // Keep this import
import { MapPin, Clock, Phone, Instagram } from "lucide-react";

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  return {
    title: t("dojos_page_title"),
    description: t("dojos_page_description"),
  };
}

export default async function Dojo(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      <Header lang={lang} />
      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              {t("dojo_locations_schedules_contacts")}
            </h1>
          </div>
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0">
            <Image
              src="/tenkei_logo.png"
              alt="Tenkei Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {schedules.map((schedule, index) => (
            <div key={index} className="p-8 rounded-3xl glass border-white/5 hover:border-white/10 transition-all group">
              <h2 className="text-2xl font-bold mb-6 group-hover:text-blue-500 transition-colors">{schedule.title}</h2>
              <div className="space-y-4">
                <p className="text-white/60 leading-relaxed">{schedule.description}</p>

                <div className="flex items-start gap-3 text-white/70">
                  <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                  <a
                    className="hover:text-white transition-colors break-all"
                    href={schedule.location}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {schedule.location}
                  </a>
                </div>

                <div className="flex items-center gap-3 text-white/70">
                  <Clock className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>{schedule.time}</span>
                </div>

                <div className="flex items-center gap-3 text-white/70">
                  <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>{schedule.contact}</span>
                </div>

                {schedule.ig && (
                  <div className="flex items-center gap-3 text-white/70">
                    <Instagram className="w-5 h-5 text-blue-500 shrink-0" />
                    <a
                      className="hover:text-white transition-colors"
                      href={schedule.ig}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {schedule.ig.replace('https://www.instagram.com/', '@').replace('/', '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mb-24 p-8 rounded-3xl glass border-white/5">
          <h2 className="text-3xl font-bold mb-8 text-center">{t("dojo_fees")}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 font-bold text-white/40 uppercase tracking-widest text-xs">
                    {t("type")}
                  </th>
                  <th className="pb-4 pl-4 font-bold text-white/40 uppercase tracking-widest text-xs">
                    {t("cost")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Object.entries(fees).map(([key, value]) => (
                  <tr
                    key={key}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 text-white/80 group-hover:text-white">{key}</td>
                    <td className="py-4 pl-4 text-white/60 group-hover:text-white font-mono">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8 text-sm text-white/40 italic text-center">{t("fees_note")}</p>
        </div>

        <div className="flex justify-center">
            <JoinButton lang={lang} />
        </div>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
