import { getT } from "../app/i18n"; // Adjust path as needed

import pkg from "../package.json";
export default async function Footer({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");
  return (
    <footer className="bg-[#363636]">
      <div className="mx-auto max-w-7xl overflow-hidden py-5 px-6 lg:px-8">
        <p className="text-xs sm:text-center leading-5 text-gray-400">
          {t("made_with_love")} &copy;{new Date().getFullYear()}{" "}
          {t("tenkei_aikidojo")}. {t("footer_rights_reserved")} Version:
          {pkg.version}.
          <a
            href="mailto:info@tenkeiaikidojo.org"
            className="text-blue-500 hover:underline ml-4"
          >
            {t("contact_us")}
          </a>
        </p>
      </div>
    </footer>
  );
}
