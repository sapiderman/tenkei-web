import { getT } from "../app/i18n"; // Adjust path as needed

import Image from "next/image";

export default async function Events({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");
  return (
    <div>
      <h2 className="flex justify-center mb-5 text-5xl font-bold">
        {t("events")}{" "}
      </h2>
      <div className="flex justify-center w-full h-[600px]">
        <iframe
          src="/happyNewYear2026.html"
          className="w-full h-full border-none rounded-lg shadow-lg"
          title="Happy New Year 2026"
        />
      </div>
    </div>
  );
}
