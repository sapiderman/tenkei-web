import { getT } from "../app/i18n";
import pkg from "../package.json";
import Link from "next/link";
import Image from "next/image";

export default async function Footer({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  return (
    <footer className="bg-zinc-950 border-t border-white/5 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href={`/${lang}`} className="flex items-center gap-3 mb-6">
              <div className="relative w-8 h-8">
                <Image
                  src="/tenkei_logo.png"
                  alt="Tenkei Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-lg tracking-tight">TENKEI AIKIDOJO</span>
            </Link>
            <p className="text-white/50 max-w-sm leading-relaxed">
              {t("tenkei_aikidojo_description")}
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white/30">Navigation</h4>
            <ul className="space-y-4 text-white/60">
              <li><Link href={`/${lang}/about`} className="hover:text-white transition-colors">{t("about_us")}</Link></li>
              <li><Link href={`/${lang}/dojos`} className="hover:text-white transition-colors">{t("dojos")}</Link></li>
              <li><Link href={`/${lang}/shinjuku`} className="hover:text-white transition-colors">{t("shinjuku_aikikai")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-white/30">Contact</h4>
            <ul className="space-y-4 text-white/60">
              <li><a href="mailto:info@tenkeiaikidojo.org" className="hover:text-white transition-colors">info@tenkeiaikidojo.org</a></li>
              <li className="text-sm">Jakarta & Depok, Indonesia</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-white/30">
            {t("made_with_love")} &copy; {new Date().getFullYear()} {t("tenkei_aikidojo")}. {t("footer_rights_reserved")} v{pkg.version}
          </p>
          <div className="flex gap-6 text-xs text-white/30">
             <span>Proud branch of Shinjuku Aikikai</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
