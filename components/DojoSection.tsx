import { getT } from "@/app/i18n";
import Link from "next/link";
import { ArrowRight, MapPin, Calendar } from "lucide-react";

export default async function DojoSection({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  const dojos = [
    {
      name: t("dojo_blok_s"),
      location: t("loc_south_jakarta"),
      schedule: t("sched_tue_thu"),
    },
    {
      name: t("dojo_ragunan"),
      location: t("loc_south_jakarta"),
      schedule: t("sched_wed_sat"),
    },
    {
      name: t("dojo_mayapada"),
      location: t("loc_south_jakarta"),
      schedule: t("sched_mon_fri"),
    },
    {
      name: t("dojo_kemenpora"),
      location: t("loc_central_jakarta"),
      schedule: t("sched_wed"),
    },
  ];

  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold text-blue-500 uppercase tracking-widest mb-4">
              {t("training_grounds")}
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {t("dojos")}
            </h3>
            <p className="text-white/60 text-lg">{t("dojo_section_desc")}</p>
          </div>
          <Link
            href={`/${lang}/dojos`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass hover:bg-white/10 transition-all font-medium"
          >
            {t("explore_dojos_desc")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dojos.map((dojo, index) => (
            <div key={index} className="p-6 rounded-3xl glass border-white/5 hover:border-white/10 transition-all flex flex-col justify-between group">
              <div>
                <h4 className="text-xl font-bold mb-4 group-hover:text-blue-500 transition-colors">{dojo.name}</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white/50 text-sm">
                    <MapPin className="w-4 h-4" />
                    {dojo.location}
                  </div>
                  <div className="flex items-center gap-3 text-white/50 text-sm">
                    <Calendar className="w-4 h-4" />
                    {dojo.schedule}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
