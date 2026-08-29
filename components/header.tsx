import Link from "next/link";
import Image from "next/image";
import { getT } from "../app/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

export default async function Header({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  const nav = [
    { href: `/${lang}/about`, label: t("about_us") },
    { href: `/${lang}/dojos`, label: t("dojos") },
  ];

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-hairline">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={`/${lang}`} className="flex items-center gap-2.5">
          <Image
            src="/tenkei_logo.png"
            alt="Tenkei Aikidojo"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            priority
          />
          <span className="font-display hidden text-lg tracking-wide text-ink sm:inline">
            Tenkei Aikidojo
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center gap-1 sm:gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sharp px-2.5 py-1.5 text-sm text-ink/80 hover:text-ai transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href={`/${lang}/register`}
            className="ml-1 rounded-sharp bg-ai px-4 py-1.5 text-sm font-medium text-paper hover:bg-ai-deep transition-colors"
          >
            {t("join_now")}
          </Link>
          <div className="ml-1">
            <LanguageSwitcher currentLang={lang} />
          </div>
        </div>
      </div>
    </header>
  );
}
