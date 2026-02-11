import { getT } from "../../i18n";
import { dir } from "i18next";
import { languages } from "../../i18n/settings";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params: { lang },
}: {
  params: { lang: string };
}): Promise<Metadata> {
  const { t } = await getT(lang, "common"); // Use 'common' namespace

  const title = t("tenkei_aikidojo"); // Assuming a translation key for the title
  const description = t("tenkei_aikidojo_description"); // Assuming a translation key for the description

  return {
    title,
    description,
    keywords:
      "Aikido, Tenkei Aikidojo, Jakarta, martial arts, self-defense, dojo, training, martial arts classes",
    openGraph: {
      title,
      description,
      url: "https://www.tenkeiaikidojo.org",
      siteName: "Tenkei Aikidojo",
      images: [
        {
          url: "https://www.tenkeiaikidojo.org/tenkei_logo_text.png",
          width: 1200,
          height: 630,
          alt: "Tenkei Aikidojo Logo",
        },
      ],
      locale: lang === "en" ? "en_US" : lang === "id" ? "id_ID" : "ja_JP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@tenkeiaikidojo",
      images: ["https://www.tenkeiaikidojo.org/tenkei_logo_text.png"],
    },
  };
}
