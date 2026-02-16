import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tenkei Aikidojo",
  description:
    "Tenkei Aikidojo is a martial arts dojo in Jakarta, offering Aikido training for all ages and skill levels. Join us to learn self-defense, discipline, and harmony.",
  keywords:
    "Aikido, Tenkei Aikidojo, Jakarta, martial arts, self-defense, dojo, training, martial arts classes",
  openGraph: {
    title: "Tenkei Aikidojo",
    description:
      "Tenkei Aikidojo is a martial arts dojo in Jakarta, offering Aikido training for all ages and skill levels. Join us to learn self-defense, discipline, and harmony.",
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
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tenkei Aikidojo",
    description:
      "Tenkei Aikidojo is a martial arts dojo in Jakarta, offering Aikido training for all ages and skill levels. Join us to learn self-defense, discipline, and harmony.",
    creator: "@tenkeiaikidojo",
    images: ["https://www.tenkeiaikidojo.org/tenkei_logo_text.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <LocalBusinessSchema />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
