import { getT } from "../app/i18n";
import Link from "next/link";
import pkg from "../package.json";

export default async function Footer({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  const links = [
    { href: `/${lang}/about`, label: t("about_us") },
    { href: `/${lang}/dojos`, label: t("dojos") },
    { href: `/${lang}/shinjuku`, label: t("shinjuku_aikikai") },
    { href: "https://blog.tenkeiaikidojo.org/", label: t("blogs") },
  ];

  return (
    <footer className="bg-ai-deep text-paper/70">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-b border-paper/15 pb-5">
          {links.map((link) =>
            link.href.startsWith("http") ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-paper/80 transition-colors hover:text-paper"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-paper/80 transition-colors hover:text-paper"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
        <p className="pt-5 text-center text-xs leading-5 text-paper/60">
          {t("made_with_love")} &copy;{new Date().getFullYear()}{" "}
          {t("tenkei_aikidojo")}. {t("footer_rights_reserved")} Version:
          {pkg.version}.
          <a
            href="mailto:info@tenkeiaikidojo.org"
            className="text-paper/80 hover:text-paper underline ml-4"
          >
            {t("contact_us")}
          </a>
          <Link
            href={`/${lang}/privacy`}
            className="text-paper/80 hover:text-paper underline ml-4"
          >
            {t("privacy_policy")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
