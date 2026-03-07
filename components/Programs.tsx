import { getT } from "@/app/i18n";
import {
  Users,
  ShieldCheck,
  Target,
  Zap,
  HeartPulse,
  Globe
} from "lucide-react";

export default async function Programs({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  const programs = [
    {
      title: t("program_adult_title"),
      description: t("program_adult_desc"),
      icon: Users,
    },
    {
      title: t("program_kids_title"),
      description: t("program_kids_desc"),
      icon: HeartPulse,
    },
    {
      title: t("program_self_defense_title"),
      description: t("program_self_defense_desc"),
      icon: ShieldCheck,
    },
    {
      title: t("program_meditation_title"),
      description: t("program_meditation_desc"),
      icon: Target,
    },
    {
      title: t("program_affiliation_title"),
      description: t("program_affiliation_desc"),
      icon: Globe,
    },
    {
      title: t("program_dynamic_title"),
      description: t("program_dynamic_desc"),
      icon: Zap,
    },
  ];

  return (
    <section className="py-24 bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-sm font-semibold text-blue-500 uppercase tracking-widest mb-4">
            {t("our_expertise")}
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            {t("mastering_harmony")}
          </h3>
          <p className="text-white/60 text-lg max-w-2xl">{t("programs_desc")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <div
              key={index}
              className="group p-8 rounded-3xl glass border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                <program.icon className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="text-xl font-bold mb-4">{program.title}</h4>
              <p className="text-white/60 leading-relaxed">
                {program.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
