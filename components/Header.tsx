import Link from "next/link";
import Image from "next/image";
import LanguageSwitcher from "./LanguageSwitcher";
import { getT } from "@/app/i18n";

export default async function Header({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  const navItems = [
    { name: t("about_us"), href: `/${lang}/about` },
    { name: t("dojos"), href: `/${lang}/dojos` },
    { name: t("blogs"), href: "https://blog.tenkeiaikidojo.org/" },
    { name: t("shinjuku_aikikai"), href: `/${lang}/shinjuku` },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href={`/${lang}`} className="flex items-center gap-3 group">
          <div className="relative w-10 h-10">
            <Image
              src="/tenkei_logo.png"
              alt="Tenkei Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">
            TENKEI AIKIDOJO
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              target={item.href.startsWith("http") ? "_blank" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="scale-90 origin-right">
             <LanguageSwitcher currentLang={lang} />
          </div>
        </div>
      </div>
    </header>
  );
}
