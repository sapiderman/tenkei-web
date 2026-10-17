import type { Metadata } from "next";

export const SITE_URL = "https://www.tenkeiaikidojo.org";

/**
 * Per-page metadata with canonical + hreflang pointing at THIS page in every
 * locale. Page-level `alternates` replaces the layout's wholesale in Next's
 * metadata merge, so every indexable page must build its own — partial
 * alternates (canonical only) silently drop hreflang.
 */
export function pageMetadata(
  lang: string,
  path: string,
  title: string,
  description: string,
): Metadata {
  const prefix = `/${lang}${path}`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${prefix}`,
      languages: {
        en: `${SITE_URL}/en${path}`,
        id: `${SITE_URL}/id${path}`,
        ja: `${SITE_URL}/ja${path}`,
        "x-default": `${SITE_URL}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${prefix}`,
      siteName: "Tenkei Aikidojo",
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Tenkei Aikidojo",
        },
      ],
      locale: lang === "id" ? "id_ID" : lang === "ja" ? "ja_JP" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}
