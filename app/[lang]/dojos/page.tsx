import JoinButton from "@/components/joinButton";
import Image from "next/image";
import { getT } from "@/app/i18n"; // Use alias path
import type { Metadata } from "next";
import { fees, schedules } from "./data"; // Keep this import

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  const title = t("dojos_page_title");
  const description = t("dojos_page_description");

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.tenkeiaikidojo.org/${lang}/dojos`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.tenkeiaikidojo.org/${lang}/dojos`,
      type: "website",
    },
  };
}

export default async function Dojo(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  return (
    <>
      <main className="flex min-h-screen flex-col items-start px-4 py-16 sm:px-6 max-w-6xl mx-auto w-full">
        {/* Flex container to align heading and logo */}
        <div className="flex items-center justify-left gap-4 sm:gap-6">
          {/* Heading - text-center removed as flex container handles centering */}
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">
            {t("dojo_locations_schedules_contacts")}
          </h1>
          {/* Sized container for the logo */}
          {/* Adjust w-XX h-XX classes to control the logo size (e.g., w-16 h-16 is 64px) */}
          <div className="relative w-10 h-10 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
            <Image
              src="/tenkei_logo.png"
              alt="Tenkei Logo"
              fill
              sizes="(max-width: 640px) 40px, (max-width: 768px) 80px, 96px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {schedules.map((schedule, index) => (
          <div key={index} className="my-4 border-b border-hairline pb-4">
            <h2 className="font-display text-xl font-bold">{schedule.title}</h2>
            <p>{schedule.description}</p>
            <a
              className="text-ai hover:text-ai-deep underline"
              href={schedule.location}
              target="_blank"
              rel="noopener noreferrer"
            >
              {schedule.location}
            </a>
            <p>{schedule.time}</p>
            <p>{schedule.contact}</p>
            {schedule.ig && (
              <>
                <p>
                  ig:{" "}
                  <a
                    className="text-ai hover:text-ai-deep underline"
                    href={schedule.ig}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {schedule.ig}
                  </a>
                </p>
              </>
            )}
          </div>
        ))}

        <div className="my-6">
          <h2 className="font-display text-xl font-bold mb-2">
            {t("dojo_fees")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-lg text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/30">
                  <th className="py-1 font-medium text-ai-deep">{t("type")}</th>
                  <th className="py-1 pl-4 font-medium text-ai-deep">
                    {t("cost")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(fees).map(([key, value]) => (
                  <tr
                    key={key}
                    className="border-b border-hairline last:border-0 hover:bg-ink/[0.03] transition-colors"
                  >
                    <td className="py-1 text-ink/80">{key}</td>
                    <td className="py-1 pl-4 text-ink/60">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-ink/70 italic">{t("fees_note")}</p>
        </div>
        <JoinButton lang={lang} />
      </main>
    </>
  );
}
