import { getT } from "../app/i18n"; // Adjust path as needed

import Image from "next/image";

export default async function Events({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");
  return (
    <div>
      <h2 className="flex justify-center mb-5 text-5xl font-bold">
        {t("events")}{" "}
      </h2>
      <div className="relative w-full aspect-video">
        <Image
          src="https://asset.tenkeiaikidojo.org/events/ramadhan.png"
          alt="Ramadhan greeting from Tenkei Aikidojo"
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
