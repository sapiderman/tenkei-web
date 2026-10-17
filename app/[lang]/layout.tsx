import { getT } from "../i18n";
import { languages } from "../i18n/settings";
import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import { SITE_URL } from "@/lib/seo";
import "../globals.css";

// CJK fonts are sliced into hundreds of unicode-range files; preloading them
// pushes ~5 MB of font bytes on first paint. Let the browser fetch only the
// slices the page actually renders.
const shipporiMincho = Shippori_Mincho({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-shippori",
  display: "swap",
  preload: false,
});

const zenKakuGothic = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-zen-kaku",
  display: "swap",
  preload: false,
});

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common"); // Use 'common' namespace

  // Fallback metadata for pages without their own generateMetadata (portal
  // pages). Indexable pages build theirs with pageMetadata() so canonical and
  // hreflang point at the page itself — partial alternates drop hreflang.
  const title = t("site_title");
  const description = t("tenkei_aikidojo_description");

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${lang}`,
      siteName: "Tenkei Aikidojo",
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Tenkei Aikidojo",
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
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <html
      lang={lang}
      className={`${shipporiMincho.variable} ${zenKakuGothic.variable}`}
    >
      <body suppressHydrationWarning>
        <LocalBusinessSchema lang={lang} />
        <Header lang={lang} />
        {children}
        <Footer lang={lang} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
